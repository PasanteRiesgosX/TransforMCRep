BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[SurveyAttempt]
ADD [aiFeedbackStatus] NVARCHAR(20) NOT NULL
CONSTRAINT [SurveyAttempt_aiFeedbackStatus_df] DEFAULT N'NOT_REQUESTED';

EXEC sys.sp_executesql N'
    UPDATE [dbo].[SurveyAttempt]
    SET [aiFeedbackStatus] = N''COMPLETED''
    WHERE [status] = N''SUBMITTED'' AND [aiFeedbackJson] IS NOT NULL;
';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH