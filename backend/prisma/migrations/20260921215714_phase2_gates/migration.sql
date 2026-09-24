BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Question] ADD [passingValue] INT;

-- AlterTable
ALTER TABLE [dbo].[QuestionOption] ADD [isPassing] BIT NOT NULL CONSTRAINT [QuestionOption_isPassing_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
