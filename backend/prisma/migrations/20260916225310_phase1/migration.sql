/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] DROP COLUMN [role];
ALTER TABLE [dbo].[User] ADD [appRoleId] INT NOT NULL CONSTRAINT [User_appRoleId_df] DEFAULT 1,
[position] NVARCHAR(1000) NOT NULL CONSTRAINT [User_position_df] DEFAULT 'USER';

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Question] (
    [id] NVARCHAR(1000) NOT NULL,
    [text] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [dimension] NVARCHAR(1000),
    [rubricCategory] NVARCHAR(1000),
    [weight] DECIMAL(32,16) NOT NULL CONSTRAINT [Question_weight_df] DEFAULT 1,
    [isGate] BIT NOT NULL CONSTRAINT [Question_isGate_df] DEFAULT 0,
    [scoreEligible] BIT NOT NULL CONSTRAINT [Question_scoreEligible_df] DEFAULT 1,
    [orderIndex] INT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [Question_isActive_df] DEFAULT 1,
    [minValue] INT,
    [maxValue] INT,
    [stepValue] INT,
    [minLabel] NVARCHAR(1000),
    [maxLabel] NVARCHAR(1000),
    [createdById] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Question_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Question_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[QuestionOption] (
    [id] NVARCHAR(1000) NOT NULL,
    [questionId] NVARCHAR(1000) NOT NULL,
    [text] NVARCHAR(1000) NOT NULL,
    [value] DECIMAL(32,16) NOT NULL,
    [orderIndex] INT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [QuestionOption_isActive_df] DEFAULT 1,
    CONSTRAINT [QuestionOption_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SurveyAttempt] (
    [id] NVARCHAR(1000) NOT NULL,
    [subjectUserId] NVARCHAR(1000) NOT NULL,
    [evaluatorUserId] NVARCHAR(1000) NOT NULL,
    [evaluationType] NVARCHAR(1000) NOT NULL CONSTRAINT [SurveyAttempt_evaluationType_df] DEFAULT 'AUTOEVALUACION',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [SurveyAttempt_status_df] DEFAULT 'IN_PROGRESS',
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [SurveyAttempt_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [submittedAt] DATETIME2,
    [payloadJson] NVARCHAR(max),
    CONSTRAINT [SurveyAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Answer] (
    [id] NVARCHAR(1000) NOT NULL,
    [attemptId] NVARCHAR(1000) NOT NULL,
    [questionId] NVARCHAR(1000) NOT NULL,
    [questionTextSnapshot] NVARCHAR(1000) NOT NULL,
    [questionTypeSnapshot] NVARCHAR(1000) NOT NULL,
    [dimensionSnapshot] NVARCHAR(1000),
    [weightSnapshot] DECIMAL(32,16) NOT NULL,
    [selectedOptionId] NVARCHAR(1000),
    [optionTextSnapshot] NVARCHAR(1000),
    [optionValueSnapshot] DECIMAL(32,16),
    [numericValue] INT,
    [textValue] NVARCHAR(max),
    CONSTRAINT [Answer_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_appRoleId_fkey] FOREIGN KEY ([appRoleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuestionOption] ADD CONSTRAINT [QuestionOption_questionId_fkey] FOREIGN KEY ([questionId]) REFERENCES [dbo].[Question]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Answer] ADD CONSTRAINT [Answer_attemptId_fkey] FOREIGN KEY ([attemptId]) REFERENCES [dbo].[SurveyAttempt]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
