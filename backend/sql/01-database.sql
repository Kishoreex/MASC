/* Run in SQL Server Management Studio as an authorized SQL administrator. */
IF DB_ID(N'MadhaCollege') IS NULL CREATE DATABASE MadhaCollege;
GO
USE MadhaCollege;
GO
IF OBJECT_ID(N'dbo.AdminUsers',N'U') IS NULL
CREATE TABLE dbo.AdminUsers (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Username NVARCHAR(120) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID(N'dbo.NewsEvents',N'U') IS NULL
CREATE TABLE dbo.NewsEvents (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Type NVARCHAR(10) NOT NULL CHECK(Type IN ('news','event')),
  Title NVARCHAR(180) NOT NULL,
  Summary NVARCHAR(800) NOT NULL,
  EventDate DATE NULL,
  ImagePath NVARCHAR(400) NULL,
  Published BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_NewsEvents_Public' AND object_id=OBJECT_ID(N'dbo.NewsEvents'))
  CREATE INDEX IX_NewsEvents_Public ON dbo.NewsEvents(Type,Published,CreatedAt DESC);
GO
/* Create a separate least-privilege SQL login manually for this database.
   Example (replace the password with a real secret):
   USE master;
   CREATE LOGIN madha_app WITH PASSWORD='YOUR_STRONG_DB_PASSWORD';
   USE MadhaCollege;
   CREATE USER madha_app FOR LOGIN madha_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.NewsEvents TO madha_app;
   GRANT SELECT, INSERT ON dbo.AdminUsers TO madha_app;
   Do not use the sa account in your application.
*/
