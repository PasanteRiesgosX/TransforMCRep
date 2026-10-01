/*
  This migration removes credentials and verification codes from the legacy
  email-based authentication flow. User email remains the Microsoft identity.
*/
BEGIN TRY

BEGIN TRAN;

DROP TABLE [dbo].[EmailVerification];

ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_isVerified_df];
ALTER TABLE [dbo].[User] DROP COLUMN [password], [isVerified];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH