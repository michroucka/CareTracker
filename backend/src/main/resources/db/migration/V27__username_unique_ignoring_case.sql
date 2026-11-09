-- Login matches the username ignoring case, so "Jana" and "jana" must not be two accounts
CREATE UNIQUE INDEX app_user_username_lower_key ON app_user (lower(username)) WHERE username IS NOT NULL;
