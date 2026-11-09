-- Password reset gets its own token so that a reset request cannot overwrite a pending activation link.
ALTER TABLE app_user ADD COLUMN reset_token varchar;
ALTER TABLE app_user ADD COLUMN reset_token_expiry timestamp;

-- Accounts with a password already finished activation, so a token they still hold was issued for a reset.
UPDATE app_user
SET reset_token = activation_token,
    reset_token_expiry = token_expiry,
    activation_token = NULL,
    token_expiry = NULL
WHERE activation_token IS NOT NULL AND password IS NOT NULL;
