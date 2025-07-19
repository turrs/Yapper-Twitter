-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- Create user_sessions table for token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    user_agent TEXT,
    ip_address INET
);

-- Create user_activity_log table for tracking usage
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to hash password
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Create function to verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql;

-- Create function to create new user
CREATE OR REPLACE FUNCTION create_user(
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_full_name VARCHAR(255) DEFAULT NULL,
    p_username VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;
    
    -- Check if username already exists (if provided)
    IF p_username IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;
    
    -- Insert new user
    INSERT INTO users (email, password_hash, full_name, username)
    VALUES (p_email, hash_password(p_password), p_full_name, p_username)
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
    p_email VARCHAR(255),
    p_password VARCHAR(255)
)
RETURNS TABLE(
    user_id UUID,
    email VARCHAR(255),
    full_name VARCHAR(255),
    username VARCHAR(100),
    role VARCHAR(50),
    is_active BOOLEAN,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.username,
        u.role,
        u.is_active,
        u.is_verified
    FROM users u
    WHERE u.email = p_email 
    AND verify_password(p_password, u.password_hash)
    AND u.is_active = true;
    
    -- Update last login and login count if user found
    IF FOUND THEN
        UPDATE users 
        SET last_login = NOW(), 
            login_count = login_count + 1
        WHERE email = p_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to create session token
CREATE OR REPLACE FUNCTION create_session(
    p_user_id UUID,
    p_token_hash VARCHAR(255),
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Deactivate old sessions for this user
    UPDATE user_sessions 
    SET is_active = false 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Create new session
    INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (p_user_id, p_token_hash, p_expires_at, p_user_agent, p_ip_address)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate session token
CREATE OR REPLACE FUNCTION validate_session(p_token_hash VARCHAR(255))
RETURNS TABLE(
    user_id UUID,
    email VARCHAR(255),
    full_name VARCHAR(255),
    username VARCHAR(100),
    role VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.username,
        u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = p_token_hash
    AND s.expires_at > NOW()
    AND s.is_active = true
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some demo users
INSERT INTO users (email, password_hash, full_name, username, role, is_verified) 
VALUES 
    ('demo@example.com', hash_password('demo123'), 'Demo User', 'demo_user', 'user', true),
    ('test@example.com', hash_password('test123'), 'Test User', 'test_user', 'user', true),
    ('admin@example.com', hash_password('admin123'), 'Admin User', 'admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create a scheduled job to cleanup expired sessions (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-sessions', '0 */6 * * *', 'SELECT cleanup_expired_sessions();');

-- Grant necessary permissions (adjust as needed for your Supabase setup)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 