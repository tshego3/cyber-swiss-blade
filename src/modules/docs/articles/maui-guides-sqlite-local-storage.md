---
title: .NET MAUI guide: Encrypted SQLite local storage with relationships
summary: Store a to-do list model in an encrypted SQLite database with SQLCipher, SQLiteNetExtensions relationships, generic services, and a console test program.
category: .NET MAUI
order: 240
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI guide: Encrypted SQLite local storage with relationships

This guide shows an encrypted SQLite data layer for a .NET MAUI app. The models are a to-do list, its items, and the modification details of each item. The code also has interfaces for the database services and their implementations, and a test program.

## Before you start

Add these packages to the project file:

| Package | Version | Purpose |
| --- | --- | --- |
| `SQLitePCLRaw.bundle_e_sqlcipher` | 2.1.11 | The SQLCipher native library. |
| `sqlite-net-sqlcipher` | 1.9.172 | The `SQLite` namespace with encryption support. |
| `SQLiteNetCipherExtensions` | 2.1.0 | Relationship attributes and operations. |
| `SQLiteNetCipherExtensions.Async` | 2.1.0 | Async relationship operations. |
| `Newtonsoft.Json` | Not given | JSON conversion in `PropertyJsonConverter`. |

```xml
<Project Sdk="Microsoft.NET.Sdk">
    <!-- <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Debug|net10.0-ios|AnyCPU'">
        <ApplicationId>DemoApp</ApplicationId>
        <RuntimeIdentifiers Condition="'$(TargetFramework)' == 'net10.0-ios'">iossimulator-arm64</RuntimeIdentifiers>
        <SQLitePlatform Condition="'$(TargetFramework)' == 'net10.0-ios'">iOS</SQLitePlatform>
    </PropertyGroup> -->
    <ItemGroup>
        <PackageReference Include="SQLitePCLRaw.bundle_e_sqlcipher" Version="2.1.11" />
        <!-- <PackageReference Include="SQLitePCLRaw.provider.dynamic_cdecl" Version="2.1.11" /> -->
        <PackageReference Include="sqlite-net-sqlcipher" Version="1.9.172" />
        <PackageReference Include="SQLiteNetCipherExtensions" Version="2.1.0" />
        <PackageReference Include="SQLiteNetCipherExtensions.Async" Version="2.1.0" />
    </ItemGroup>
</Project>
```

The comments in the project file show an optional iOS simulator configuration for `net10.0-ios` (`iossimulator-arm64`, `SQLitePlatform` set to `iOS`) and an optional `SQLitePCLRaw.provider.dynamic_cdecl` 2.1.11 package.

## Code

The code is one file that runs as a console app, for example on dotnetfiddle.net. Put the blocks in one file in this order. The comments such as `// /Models/` show the folder for each part in a real MAUI project.

### Usings

```csharp
#nullable enable

using Newtonsoft.Json; // From NuGet: Newtonsoft.Json
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using SQLite; // From NuGet: sqlite-net-sqlcipher (SQLitePCLRaw.bundle_e_sqlcipher)
using SQLiteNetExtensions.Attributes; // From NuGet: SQLiteNetCipherExtensions and SQLiteNetCipherExtensions.Async
using SQLiteNetExtensions.Extensions; // For relationship operations
using SQLiteNetExtensionsAsync.Extensions; // For async relationship operations
using System.Linq; // For .Any() and .ToList() after Where
// using System.Reflection; // For PropertyInfo in BaseService

// To enable DEBUG logs from your services within dotnetfiddle.net.
// In a production MAUI app, this would be set via project configuration.
```

### Constants

`Constants` holds the log messages, the database file name, the open flags, and the database path.

```csharp
// /Utils/
// This class contains constants and utility definitions. In a real project, this might be in a 'Utils' or 'Common' folder.
public static class Constants
{
    #region Logging Messages - Information
    public static string LogInfo_EncryptionKeyGenerated = "Generated and stored new encryption key for app records.";
    public static string LogInfo_EncryptionKeyRetrieved = "Retrieved existing encryption key for records.";
    public static string LogInfo_Databaseinitialised = "App records database initialised successfully at {0}.";
    public static string LogInfo_RecordUpdated = "Updated record: {0}";
    public static string LogInfo_RecordInserted = "Inserted new record: {0}";
    public static string LogInfo_RecordRetrieved = "Retrieved record: {0}";
    public static string LogInfo_RecordNotFound = "Record '{0}' not found. Returning default value.";
    public static string LogInfo_RecordDeleted = "Deleted record: {0}";
    public static string LogInfo_RecordsRetrievedCount = "Retrieved {0} Records.";
    public static string LogInfo_CreatedTable = "Created/Ensured table for type: {0}";
    public static string LogInfo_ItemSaved = "Saved item of type {0}.";
    public static string LogInfo_ItemSaveFailed = "Failed to save item of type {0}.";
    public static string LogInfo_ItemRetrievedByKey = "Retrieved item of type {0} with key {1}.";
    public static string LogInfo_ItemNotFoundByKey = "Item of type {0} with key {1} not found.";
    public static string LogInfo_ItemsRetrievedCount = "Retrieved {0} items of type {1}.";
    public static string LogInfo_ItemDeleted = "Deleted item of type {0}.";
    public static string LogInfo_ItemDeleteFailed = "Failed to delete item of type {0}.";
    public static string LogInfo_ItemDeletedByKey = "Deleted item of type {0} with key {1}.";
    public static string LogInfo_ItemDeleteFailedByKey = "Failed to delete item of type {0} with key {1}.";
    public static string LogInfo_ItemsRetrieved = "Retrieved {1} items of type {0}.";
    public static string LogInfo_NoItemsFound = "No items found for type {0}.";
    #endregion

    #region Logging Messages - Warnings
    public static string LogWarn_KeyNotAvailableInit = "Encryption key not available during Init(). Waiting for key initialisation.";
    public static string LogWarn_DbNotAvailableSave = "Attempted to save record '{0}' but database was not available.";
    public static string LogWarn_DbNotAvailableGet = "Attempted to get record '{0}' but database was not available. Returning default value.";
    public static string LogWarn_DbNotAvailableDelete = "Attempted to delete record '{0}' but database was not available.";
    public static string LogWarn_DbNotAvailableGetAll = "Attempted to get all settings but database was not available. Returning empty list.";
    public static string LogWarn_DbNotInitialisedTableType = "DatabaseService initialised with no initial table type. Ensure table is created manually or via specific methods.";
    public static string LogWarn_DbNotInitialisedTableTypes = "DatabaseService initialised with no initial table types. Ensure tables are created manually or via specific methods.";
    #endregion

    #region Logging Messages - Errors
    public static string LogError_KeyGenerationFailed = "Failed to generate a valid encryption key.";
    public static string LogError_KeyInitInvalidOperation = "Invalid operation during encryption key initialisation.";
    public static string LogError_KeyInitUnexpected = "An unexpected error occurred during encryption key initialisation.";
    public static string LogError_KeyInitFailedDbConnect = "Failed to initialise encryption key. Database connection cannot be established.";
    public static string LogError_KeyNullOrEmptyAfterInit = "Cannot initialise database: Encryption key is null or empty after initialisation task completed.";
    public static string LogError_DbInitSQLite = "SQLite error occurred while initialising AppSettings database at {0}.";
    public static string LogError_DbInitUnexpected = "An unexpected error occurred during AppSettings database initialisation at {0}.";
    public static string LogError_SerializationFailed = "Failed to serialize value for record '{0}'.";
    public static string LogError_SaveSQLite = "SQLite error saving record '{0}'.";
    public static string LogError_SaveUnexpected = "An unexpected error occurred while saving record '{0}'.";
    public static string LogError_DeserializationFailed = "Failed to deserialize record '{0}'. Data might be corrupted. Returning default value.";
    public static string LogError_GetSQLite = "SQLite error retrieving record '{0}'. Returning default value.";
    public static string LogError_GetUnexpected = "An unexpected error occurred while retrieving record '{0}'. Returning default value.";
    public static string LogError_DeleteSQLite = "SQLite error deleting record '{0}'.";
    public static string LogError_DeleteUnexpected = "An unexpected error occurred while deleting record '{0}'.";
    public static string LogError_GetAllSQLite = "SQLite error retrieving all settings. Returning empty list.";
    public static string LogError_GetAllUnexpected = "An unexpected error occurred while retrieving all settings. Returning empty list.";
    public static string LogError_SaveSQLiteGeneric = "SQLite error saving item of type {0}.";
    public static string LogError_SaveUnexpectedGeneric = "An unexpected error occurred while saving item of type {0}.";
    public static string LogError_GetSQLiteGeneric = "SQLite error retrieving item of type {0} with key {1}.";
    public static string LogError_GetUnexpectedGeneric = "An unexpected error occurred while retrieving item of type {0} with key {1}.";
    public static string LogError_GetAllSQLiteGeneric = "SQLite error retrieving all items of type {0}.";
    public static string LogError_GetAllUnexpectedGeneric = "An unexpected error occurred while retrieving all items of type {0}.";
    public static string LogError_DeleteSQLiteGeneric = "SQLite error deleting item of type {0}.";
    public static string LogError_DeleteUnexpectedGeneric = "An unexpected error occurred while deleting item of type {0}.";
    public static string LogError_DeleteSQLiteByKeyGeneric = "SQLite error deleting item of type {0} with key {1}.";
    public static string LogError_DeleteUnexpectedByKeyGeneric = "An unexpected error occurred while deleting item of type {0} with key {1}.";
    #endregion

    public const string DatabaseFilename = "testlocaldatabase.db3";
    public const SQLite.SQLiteOpenFlags Flags =
        SQLite.SQLiteOpenFlags.ReadWrite |
        SQLite.SQLiteOpenFlags.Create |
        SQLite.SQLiteOpenFlags.FullMutex |
        SQLite.SQLiteOpenFlags.SharedCache;
    public static string DatabasePath => Path.Combine(FileSystem.AppDataDirectory, DatabaseFilename);
}
```

### Enum and JSON helper

`SettingKeys.SettingsDatabaseKey` is the SecureStorage key for the encryption key. `PropertyJsonConverter` serializes objects with `TypeNameHandling.All`. If the conversion fails, it returns an empty string or a new object.

> **WARNING:** `TypeNameHandling.All` lets the JSON choose the .NET type to create. Use it only for data that your app wrote. For data from outside the app, use `TypeNameHandling.None` or a `SerializationBinder` that allows only known types.

```csharp
// /Enums/
// This enum would typically reside in an 'Enums' or 'Common' folder.
public enum SettingKeys : int
{
    SettingsDatabaseKey = 0
}

// /Helpers/
// This helper would typically reside in an 'Helpers' folder.
public static class PropertyJsonConverter
{
    public static string ToJson<T>(T obj)
    {
        if (obj == null)
        {
            return string.Empty;
        }

        try
        {
            string json = JsonConvert.SerializeObject(
                obj,
                new JsonSerializerSettings
                {
                    TypeNameHandling = TypeNameHandling.All
                });

            return json;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return string.Empty;
        }
    }

    public static T FromJson<T>(string json) where T : new()
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new T();
        }

        try
        {
            T? obj = JsonConvert.DeserializeObject<T>(
                json,
                new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.All }
            );

            if (obj == null)
            {
                return new T();
            }

            return obj;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return new T();
        }
    }
}
```

### Mocks for the console environment

These classes replace the MAUI and logging APIs in a console app. In a MAUI app, remove them and use `SecureStorage` and `FileSystem` from `Microsoft.Maui.Storage` and `ILogger<T>` from `Microsoft.Extensions.Logging`.

```csharp
// Mock SecureStorage for console app environment.
// In a MAUI application, this would use Microsoft.Maui.Storage.SecureStorage.
public static class SecureStorage
{
    private static readonly Dictionary<string, string> _storage = new Dictionary<string, string>();

    public static Task<string> GetAsync(string key)
    {
        _storage.TryGetValue(key, out string? value);
        return Task.FromResult(value!); // Use null-forgiving operator as TryGetValue sets value to null if key not found
    }

    public static Task SetAsync(string key, string value)
    {
        _storage[key] = value;
        return Task.CompletedTask;
    }
}

// Mock FileSystem for console app environment.
// In a MAUI application, this would use Microsoft.Maui.Storage.FileSystem.
public static class FileSystem
{
    public static string AppDataDirectory
    {
        get
        {
            // Use a temporary path for dotnetfiddle.net as it's a sandboxed environment.
            // Ensure the directory exists.
            string path = Path.Combine(Path.GetTempPath(), "MyAppData");
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            return path;
        }
    }
}

// Mock ILogger interface.
// In a real application, this would be from Microsoft.Extensions.Logging.
public interface ILogger
{
    void LogInformation(string message, params object[] args);
    void LogWarning(string message, params object[] args);
    void LogError(Exception exception, string message, params object[] args);
    void LogError(string message, params object[] args);
}

// Mock ILogger<T> interface.
// In a real application, this would be from Microsoft.Extensions.Logging.
public interface ILogger<T> : ILogger { }

// Simple ConsoleLogger implementation for testing purposes.
// Logs messages to the console with the type name.
public class ConsoleLogger<T> : ILogger<T>
{
    public void LogInformation(string message, params object[] args)
    {
        Console.WriteLine($"INFO [{typeof(T).Name}]: {string.Format(message, args)}");
    }

    public void LogWarning(string message, params object[] args)
    {
        Console.WriteLine($"WARN [{typeof(T).Name}]: {string.Format(message, args)}");
    }

    public void LogError(Exception? exception, string message, params object[] args)
    {
        Console.Error.WriteLine($"ERROR [{typeof(T).Name}]: {string.Format(message, args)}\n{(exception != null ? $"Exception: {exception.Message}\nStackTrace: {exception.StackTrace}" : "")}");
    }

    public void LogError(string message, params object[] args)
    {
        Console.Error.WriteLine($"ERROR [{typeof(T).Name}]: {string.Format(message, args)}");
    }
}
```

### Models

The SQLiteNetExtensions attributes define the relationships:

- `ToDoList` has a `[OneToMany]` relationship to `ToDoItem` with `CascadeOperation.All`.
- `ToDoItem` has a `[ForeignKey]` to `ToDoList`, a unique index on `Description`, and a `[OneToOne]` relationship to `ModifiedDetail` with `CascadeOperation.All`.
- `ModifiedDetail` has a `[ForeignKey]` to `ToDoItem`.
- `ToDoItemModel` is a flat storage model. It keeps `ModifiedDetails` as a JSON string. `ToStorage` and `FromStorage` convert between the two models.

The commented-out classes are the earlier versions. They use `[Indexed]` foreign keys and `[Ignore]` navigation properties in place of the relationship attributes.

```csharp
// /Models/
// These classes represent the data models and would typically be found in a 'Models' folder.
// public class ToDoList
// {
//     [PrimaryKey, AutoIncrement, JsonIgnore]
//     public int Id { get; set; } // Primary key for this junction entry
//     public string Title { get; set; } = string.Empty; // initialise to prevent null warnings
//     [Ignore] // This property is ignored by SQLite.Net as it's a navigation property
//     public List<ToDoItem> Items { get; set; } = new List<ToDoItem>();

//     public ToDoList() { } // Parameterless constructor required by SQLite.Net
//     public ToDoList(string title)
//     {
//         Title = title;
//         Items = new List<ToDoItem>();
//     }
// }
public class ToDoList
{
    [PrimaryKey, AutoIncrement, JsonIgnore]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    [OneToMany(CascadeOperations = CascadeOperation.All)]
    public List<ToDoItem> Items { get; set; } = new List<ToDoItem>();

    public ToDoList() { }
    public ToDoList(string title)
    {
        Title = title;
        Items = new List<ToDoItem>();
    }
}

// public class ToDoItem
// {
//     [PrimaryKey, AutoIncrement, JsonIgnore]
//     public int Id { get; set; } // Primary key for this junction entry
//     [Indexed, JsonIgnore] // Indexed for faster lookups based on ToDoListId
//     public int ToDoListId { get; set; } // Foreign key to ToDoList table
//     [Indexed(Unique = true)]
//     public string Description { get; set; } = string.Empty; // initialise to prevent null warnings
//     public bool IsCompleted { get; set; }
//     public DateTime DueDate { get; set; }
//     [Ignore] // This property is ignored by SQLite.Net as it's a navigation property
//     public ModifiedDetail? ModifiedDetails { get; set; }

//     public ToDoItem() { } // Parameterless constructor required by SQLite.Net
//     public ToDoItem(string description, DateTime dueDate, bool isCompleted, ModifiedDetail modifiedDetails)
//     {
//         Description = description;
//         DueDate = dueDate;
//         IsCompleted = isCompleted;
//         ModifiedDetails = modifiedDetails;
//     }
// }
public class ToDoItem
{
    [PrimaryKey, AutoIncrement, JsonIgnore]
    public int Id { get; set; }
    [ForeignKey(typeof(ToDoList))]
    public int ToDoListId { get; set; }
    [Indexed(Unique = true)]
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime DueDate { get; set; }
    [OneToOne(CascadeOperations = CascadeOperation.All)]
    public ModifiedDetail ModifiedDetails { get; set; } = new ModifiedDetail();

    public ToDoItem() { }
    public ToDoItem(string description, DateTime dueDate, bool isCompleted, ModifiedDetail modifiedDetails)
    {
        Description = description;
        DueDate = dueDate;
        IsCompleted = isCompleted;
        ModifiedDetails = modifiedDetails;
    }
    public ToDoItem FromStorage(ToDoItemModel s)
    {
        return new ToDoItem
        {
            Id = s.Id,
            ToDoListId = s.ToDoListId,
            Description = s.Description,
            IsCompleted = s.IsCompleted,
            DueDate = s.DueDate,
            ModifiedDetails = string.IsNullOrEmpty(s.ModifiedDetails) ? new ModifiedDetail() : PropertyJsonConverter.FromJson<ModifiedDetail>(s.ModifiedDetails)
        };
    }
}
public class ToDoItemModel
{
    public int Id { get; set; }
    public int ToDoListId { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime DueDate { get; set; }
    public string ModifiedDetails { get; set; } = string.Empty;

    public ToDoItemModel ToStorage(ToDoItem m)
    {
        return new ToDoItemModel
        {
            Id = m.Id,
            ToDoListId = m.ToDoListId,
            Description = m.Description,
            IsCompleted = m.IsCompleted,
            DueDate = m.DueDate,
            ModifiedDetails = PropertyJsonConverter.ToJson(m.ModifiedDetails)
        };
    }
}

// public class ModifiedDetail
// {
//     [PrimaryKey, AutoIncrement, JsonIgnore]
//     public int Id { get; set; } // Primary key for this junction entry
//     [Indexed, JsonIgnore] // Indexed for faster lookups based on ToDoItemId
//     public int ToDoItemId { get; set; } // Foreign key to ToDoItem table
//     public string ModifiedBy { get; set; } = string.Empty; // initialise to prevent null warnings
//     public DateTime ModifiedDate { get; set; }

//     public ModifiedDetail() { } // Parameterless constructor required by SQLite.Net
//     public ModifiedDetail(string modifiedBy, DateTime modifiedDate)
//     {
//         ModifiedBy = modifiedBy;
//         ModifiedDate = modifiedDate;
//     }
// }
public class ModifiedDetail
{
    [PrimaryKey, AutoIncrement, JsonIgnore]
    public int Id { get; set; }
    [ForeignKey(typeof(ToDoItem))]
    public int ToDoItemId { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDate { get; set; }

    public ModifiedDetail() { }
    public ModifiedDetail(string modifiedBy, DateTime modifiedDate)
    {
        ModifiedBy = modifiedBy;
        ModifiedDate = modifiedDate;
    }
}
```

### Interfaces

```csharp
// /Interfaces/Database/
// These interfaces define the contract for database services and would typically be in an 'Interfaces/Database' folder.
public interface IDatabaseService
{
    Task<SQLiteAsyncConnection?> GetInitialisedDatabaseAsync();
    Task CloseInitialisedDatabaseAsync();
    Task ClearAllTables();
}

public interface IBaseService<T>
{
    Task CreateTable();
    Task<int> SaveAsync(T item, int primaryKey = 0);
    Task<T?> GetAsync(int primaryKey);
    Task<List<T>> GetAllAsync();
    Task<int> DeleteAsync(T item);
}

public interface IToDoListService : IBaseService<ToDoList> { }
public interface IToDoItemService : IBaseService<ToDoItem>
{
    Task<int> Id(string description, Nullable<int> value = null);
    Task<int> ToDoListId(string description, Nullable<int> value = null);
    Task<string> Description(string description, string? value = null);
    Task<bool> IsCompleted(string description, bool? value = null);
    Task<DateTime?> DueDate(string description, DateTime? value = null);
    // Task<ModifiedDetail?> ModifiedDetails(string description, ModifiedDetail? value = null);
    Task<ToDoItem?> GetoDoItemByDescriptionAsync(string description);
}
public interface IModifiedDetailService : IBaseService<ModifiedDetail> { }
```

### Database service

`DatabaseService` opens the encrypted connection when the first caller asks for it.

```csharp
// /Services/Database/
// These abstract and concrete service implementations would typically be in a 'Services/Database' folder.
public class DatabaseService : IDatabaseService
{
    private readonly ILogger? _logger;
    private SQLiteAsyncConnection? _database { get; set; }

    private string? _encryptionKey { get; set; }
    private readonly TaskCompletionSource<bool> _encryptionKeyInitialisedTcs = new();

    public DatabaseService(ILogger<DatabaseService>? logger)
    {
        _logger = logger;
        // Start encryption key initialisation as a background task.
        // The _encryptionKeyInitialisedTcs will signal completion or failure.
        // _ = InitialiseEncryptionKey();
    }

    /// <summary>
    /// Generates a new random 32-character GUID string for use as an encryption key.
    /// </summary>
    /// <returns>A new encryption key or an empty string if generation fails.</returns>
    private string GenerateRandomKey()
    {
        try
        {
            return Guid.NewGuid().ToString("N").Substring(0, 32);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_KeyGenerationFailed);
            return string.Empty;
        }
    }

    /// <summary>
    /// initialises the encryption key for the database. It attempts to retrieve an existing key
    /// from SecureStorage; if not found, it generates a new one and stores it.
    /// </summary>
    private async Task InitialiseEncryptionKey()
    {
        try
        {
            _encryptionKey = await SecureStorage.GetAsync(nameof(SettingKeys.SettingsDatabaseKey));

            if (string.IsNullOrEmpty(_encryptionKey))
            {
                _encryptionKey = GenerateRandomKey();
                if (string.IsNullOrEmpty(_encryptionKey))
                {
                    _logger?.LogError(Constants.LogError_KeyGenerationFailed);
                    // Signal an exception if key generation itself failed
                    _encryptionKeyInitialisedTcs.TrySetException(new InvalidOperationException(Constants.LogError_KeyGenerationFailed));
                    return;
                }
                await SecureStorage.SetAsync(nameof(SettingKeys.SettingsDatabaseKey), _encryptionKey);
#if DEBUG
                _logger?.LogInformation(Constants.LogInfo_EncryptionKeyGenerated);
#endif
            }
#if DEBUG
            else
            {
                _logger?.LogInformation(Constants.LogInfo_EncryptionKeyRetrieved);
            }
#endif
            // Signal that the encryption key has been successfully initialised
            _encryptionKeyInitialisedTcs.TrySetResult(true);
        }
        catch (InvalidOperationException ex)
        {
            _logger?.LogError(ex, Constants.LogError_KeyInitInvalidOperation);
            _encryptionKeyInitialisedTcs.TrySetException(ex);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_KeyInitUnexpected);
            _encryptionKeyInitialisedTcs.TrySetException(ex);
        }
    }

    /// <summary>
    /// initialises the SQLite database connection and creates the table for the generic type T.
    /// This method ensures the encryption key is ready before attempting database connection.
    /// </summary>
    private async Task Initialise()
    {
        // If the database connection is already established, return.
        if (_database is not null)
        {
            return;
        }

        try
        {
            // Wait for the encryption key to be initialised.
            // If an exception occurred during key initialisation, it will be re-thrown here.
            // await _encryptionKeyInitialisedTcs.Task;
            await InitialiseEncryptionKey();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_KeyInitFailedDbConnect);
            _database = null; // Ensure database is null if key initialisation failed
            return;
        }

        // Check if the encryption key is still null or empty after initialisation.
        if (string.IsNullOrEmpty(_encryptionKey))
        {
            _logger?.LogError(Constants.LogError_KeyNullOrEmptyAfterInit);
            _database = null;
            return;
        }

        try
        {
            // Create a SQLite connection string with the database path, flags, and encryption key.
            SQLiteConnectionString connectionString = new SQLiteConnectionString(
                Constants.DatabasePath,
                Constants.Flags,
                true, // StoreDateTimeAsTicks
                _encryptionKey
            );

            // initialise the SQLiteAsyncConnection.
            _database = new SQLiteAsyncConnection(connectionString);
#if DEBUG
            _logger?.LogInformation(Constants.LogInfo_Databaseinitialised, Constants.DatabasePath);
#endif
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitSQLite, Constants.DatabasePath);
            _database = null;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitUnexpected, Constants.DatabasePath);
            _database = null;
        }
    }

    /// <summary>
    /// Gets the initialised SQLiteAsyncConnection instance.
    /// Ensures the database is initialised before returning the connection.
    /// </summary>
    /// <returns>The SQLiteAsyncConnection instance, or null if initialisation failed.</returns>
    public async Task<SQLiteAsyncConnection?> GetInitialisedDatabaseAsync()
    {
        try
        {
            await Initialise(); // Ensure database is initialised
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitSQLite, Constants.DatabasePath);
            _database = null;
        }
        catch (System.Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitUnexpected, Constants.DatabasePath);
            _database = null;
        }

        return _database;
    }

    /// <summary>
    /// Closes the initialised SQLiteAsyncConnection instance.
    /// </summary>
    public async Task CloseInitialisedDatabaseAsync()
    {
        if (_database is null)
        {
            return;
        }

        try
        {
            await _database.CloseAsync();
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitSQLite, Constants.DatabasePath);
        }
        catch (System.Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitUnexpected, Constants.DatabasePath);

        }
        finally
        {
            _database = null;
            // _encryptionKey = null; // Optionally clear the encryption key after closing the database
        }
    }

    /// <summary>
    /// This method iterates through all table mappings and deletes all records from each table.
    /// </summary>
    public async Task ClearAllTables()
    {
        if (_database is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableGet);
#endif
            return;
        }

        try
        {
            List<TableMapping> tableMappings = _database.TableMappings.Where(t => t.MappedType.Equals(typeof(SQLiteConnection.ColumnInfo)).Equals(false)).ToList();
            foreach (TableMapping tableMapping in tableMappings)
            {
                await _database.DeleteAllAsync(tableMapping);
            }
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitSQLite, Constants.DatabasePath);
            _database = null;
        }
        catch (System.Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitUnexpected, Constants.DatabasePath);
            _database = null;
        }
    }
}
```

### Generic base service

`BaseService<T>` gives the create, read, update, and delete operations for one table type. It uses the async SQLiteNetExtensions methods, so it also saves, loads, and deletes the children.

```csharp
// A static field in a generic class exists once for each type argument.
// This non-generic holder gives one lock to all BaseService<T> types.
internal static class DatabaseLock
{
    public static readonly SemaphoreSlim Instance = new SemaphoreSlim(1, 1);
}

public abstract class BaseService<T> where T : new()
{
    // Static lock shared across all BaseService<T> instances to prevent SQLite contention
    // between foreground UI operations and background sync service.
    protected static readonly SemaphoreSlim _dbLock = DatabaseLock.Instance;

    protected readonly ILogger _logger;
    protected readonly IDatabaseService _databaseService;

    public BaseService(ILogger logger, IDatabaseService databaseService)
    {
        _logger = logger;
        _databaseService = databaseService;
    }

    /// <summary>
    /// Initialises the SQLite database connection and creates the table for the generic type T.
    /// </summary>
    public async Task InitialiseTableAsync()
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableGet, typeof(T).Name);
#endif
            return;
        }

        try
        {
            // Create the table for type T if it doesn't already exist.
            await db.CreateTableAsync(typeof(T));
#if DEBUG
            _logger?.LogInformation(Constants.LogInfo_CreatedTable, typeof(T).Name);
#endif
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitSQLite, Constants.DatabasePath);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DbInitUnexpected, Constants.DatabasePath);
        }
    }

    /// <summary>
    /// Inserts a new item or updates an existing item in the database.
    /// If primaryKey is not 0, the method updates the item. If primaryKey is 0, it inserts the item.
    /// </summary>
    /// <param name="item">The item to save.</param>
    /// <param name="primaryKey">An optional primary key to use for updates, if item.Id is 0. Primarily used for explicit update scenarios.</param>
    /// <returns>The number of rows affected (1 for success, 0 for failure).</returns>
    protected async Task<int> InsertOrUpdateAsync(T item, int primaryKey = 0)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableSave, typeof(T).Name);
#endif
            return 0;
        }

        await _dbLock.WaitAsync();
        try
        {
            if (primaryKey is not 0)
            {
                await db.UpdateWithChildrenAsync(item);
                int result = 1;
#if DEBUG
                _logger?.LogInformation(
                    result > 0 ? Constants.LogInfo_ItemSaved : Constants.LogInfo_ItemSaveFailed,
                    typeof(T).Name
                );
#endif
                return result;
            }
            else
            {
                await db.InsertWithChildrenAsync(item, recursive: true);
                int result = 1;
#if DEBUG
                _logger?.LogInformation(
                    result > 0 ? Constants.LogInfo_ItemSaved : Constants.LogInfo_ItemSaveFailed,
                    typeof(T).Name
                );
#endif
                return result;
            }
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_SaveSQLiteGeneric, typeof(T).Name);
            return 0;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_SaveUnexpectedGeneric, typeof(T).Name);
            return 0;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Finds and retrieves an item from the database by its primary key.
    /// </summary>
    /// <param name="primaryKey">The primary key of the item to retrieve.</param>
    /// <returns>The retrieved item, or default(T) if not found or an error occurs.</returns>
    protected async Task<T?> FindAsync(int primaryKey)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableGet, typeof(T).Name);
#endif
            return default(T);
        }

        await _dbLock.WaitAsync();
        try
        {
            T? item = await db.GetWithChildrenAsync<T>(primaryKey, recursive: true);
            if (item != null)
            {
#if DEBUG
                _logger?.LogInformation(Constants.LogInfo_ItemRetrievedByKey, typeof(T).Name, primaryKey);
#endif
            }
            else
            {
#if DEBUG
                _logger?.LogInformation(Constants.LogInfo_ItemNotFoundByKey, typeof(T).Name, primaryKey);
#endif
            }
            return item;
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetSQLiteGeneric, typeof(T).Name, primaryKey);
            return default(T);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetUnexpectedGeneric, typeof(T).Name, primaryKey);
            return default(T);
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Retrieves all items of type T from the database.
    /// </summary>
    /// <returns>A list of all items of type T.</returns>
    protected async Task<List<T>> FindAllAsync()
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableGetAll, typeof(T).Name);
#endif
            return new List<T>();
        }

        await _dbLock.WaitAsync();
        try
        {
            List<T> items = await db.GetAllWithChildrenAsync<T>(recursive: true);
#if DEBUG
            _logger?.LogInformation(
                items.Count > 0 ? Constants.LogInfo_ItemsRetrieved : Constants.LogInfo_NoItemsFound,
                typeof(T).Name,
                items.Count
            );
#endif
            return items;
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllSQLiteGeneric, typeof(T).Name);
            return new List<T>();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllUnexpectedGeneric, typeof(T).Name);
            return new List<T>();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Deletes an item from the database.
    /// </summary>
    /// <param name="item">The item to delete.</param>
    /// <returns>The number of rows affected (1 for success, 0 for failure).</returns>
    protected async Task<int> RemoveAsync(T item)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableDelete, typeof(T).Name);
#endif
            return 0;
        }

        await _dbLock.WaitAsync();
        try
        {
            await db.DeleteAsync(item, recursive: true);
#if DEBUG
            _logger?.LogInformation(Constants.LogInfo_ItemDeleted, typeof(T).Name);
#endif
            return 1;
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DeleteSQLiteGeneric, typeof(T).Name);
            return 0;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DeleteUnexpectedGeneric, typeof(T).Name);
            return 0;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Returns all items of type T matching the given predicate (no children loaded).
    /// </summary>
    protected async Task<List<T>> FindAllWhere(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null) return new List<T>();

        await _dbLock.WaitAsync();
        try
        {
            return await db.Table<T>().Where(predicate).ToListAsync();
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllSQLiteGeneric, typeof(T).Name);
            return new List<T>();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllUnexpectedGeneric, typeof(T).Name);
            return new List<T>();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Returns all items of type T matching the given predicate, with children loaded via
    /// SQLiteNetExtensions (optionally recursive).
    /// </summary>
    protected async Task<List<T>> FindAllWithChildrenWhere(
        System.Linq.Expressions.Expression<Func<T, bool>> predicate,
        bool recursive = false)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null) return new List<T>();

        await _dbLock.WaitAsync();
        try
        {
            return await db.GetAllWithChildrenAsync<T>(predicate, recursive);
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllSQLiteGeneric, typeof(T).Name);
            return new List<T>();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetAllUnexpectedGeneric, typeof(T).Name);
            return new List<T>();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Deletes all items of type T matching the given predicate.
    /// </summary>
    protected async Task<int> DeleteAllWhere(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null) return 0;

        await _dbLock.WaitAsync();
        try
        {
            return await db.Table<T>().DeleteAsync(predicate);
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_DeleteSQLiteGeneric, typeof(T).Name);
            return 0;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_DeleteUnexpectedGeneric, typeof(T).Name);
            return 0;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    /// <summary>
    /// Find To Do Item and retrieves an item from the database by its Description.
    /// </summary>
    /// <param name="description">The Description of the item to retrieve.</param>
    /// <returns>The retrieved item, or null if not found or an error occurs.</returns>
    protected async Task<ToDoItem?> FindToDoItemByDescriptionAsync(string description)
    {
        SQLiteAsyncConnection? db = await _databaseService.GetInitialisedDatabaseAsync();
        if (db is null)
        {
#if DEBUG
            _logger?.LogWarning(Constants.LogWarn_DbNotAvailableGet, typeof(T).Name);
#endif
            return null;
        }

        await _dbLock.WaitAsync();
        try
        {
            ToDoItem? item = await db.Table<ToDoItem>()
                                        .Where(t => t.Description == description)
                                        .FirstOrDefaultAsync();
            if (item != null)
            {
#if DEBUG
                _logger?.LogInformation(Constants.LogInfo_ItemRetrievedByKey, typeof(T).Name, description);
#endif
            }
            else
            {
#if DEBUG
                _logger?.LogInformation(Constants.LogInfo_ItemNotFoundByKey, typeof(T).Name, description);
#endif
            }
            return item;
        }
        catch (SQLiteException ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetSQLiteGeneric, typeof(T).Name, description);
            return null;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, Constants.LogError_GetUnexpectedGeneric, typeof(T).Name, description);
            return null;
        }
        finally
        {
            _dbLock.Release();
        }
    }
}
```

### Table services

`ToDoItemService` has methods that get or set one property of an item. The item is found by its `Description`. The commented-out methods in `ToDoListService` save, load, and delete the children manually. The cascade operations in `BaseService<T>` replace them.

```csharp
public class ModifiedDetailService : BaseService<ModifiedDetail>, IModifiedDetailService
{
    public ModifiedDetailService(ILogger<ModifiedDetailService> logger, IDatabaseService databaseService) : base(logger, databaseService)
    {
        // The first call to GetInitialisedDatabaseAsync initialises the encryption key and the connection.
        // Explicitly calling GetInitialisedDatabaseAsync here is not strictly necessary if the first
        // call to SaveAsync/GetAsync etc. will trigger it anyway. However, it ensures table creation
        // happens early.
        // _ = GetInitialisedDatabaseAsync();
    }

    public async Task CreateTable() => await InitialiseTableAsync();
    public async Task<int> SaveAsync(ModifiedDetail item, int primaryKey = 0) => await InsertOrUpdateAsync(item, primaryKey);
    public async Task<ModifiedDetail?> GetAsync(int primaryKey) => await FindAsync(primaryKey);
    public async Task<List<ModifiedDetail>> GetAllAsync() => await FindAllAsync();
    public async Task<int> DeleteAsync(ModifiedDetail item) => await RemoveAsync(item);
}

public class ToDoItemService : BaseService<ToDoItem>, IToDoItemService
{
    public ToDoItemService(ILogger<ToDoItemService> logger, IDatabaseService databaseService) : base(logger, databaseService)
    {
        // The first call to GetInitialisedDatabaseAsync initialises the encryption key and the connection.
        // Explicitly calling GetInitialisedDatabaseAsync here is not strictly necessary if the first
        // call to SaveAsync/GetAsync etc. will trigger it anyway. However, it ensures table creation
        // happens early.
        // _ = GetInitialisedDatabaseAsync();
    }

    public async Task<int> Id(string description, Nullable<int> value = null)
    {
        return await GetOrSetPropertyAsync<int?>(description, value, td => td.Id, (td, v) => td.Id = v ?? 0) ?? 0;
    }

    public async Task<int> ToDoListId(string description, Nullable<int> value = null)
    {
        return await GetOrSetPropertyAsync<int?>(description, value, td => td.ToDoListId, (td, v) => td.ToDoListId = v ?? 0) ?? 0;
    }

    public async Task<string> Description(string description, string? value = null)
    {
        return await GetOrSetPropertyAsync<string>(description, value, td => td.Description, (td, v) => td.Description = v);
    }

    public async Task<bool> IsCompleted(string description, bool? value = null)
    {
        return await GetOrSetPropertyAsync<bool?>(description, value, td => td.IsCompleted, (td, v) => td.IsCompleted = v ?? false) ?? false;
    }

    public async Task<DateTime?> DueDate(string description, DateTime? value = null)
    {
        return await GetOrSetPropertyAsync<DateTime?>(description, value, td => td.DueDate, (td, v) => td.DueDate = v ?? DateTime.Now) ?? DateTime.Now;
    }

    // public async Task<ModifiedDetail?> ModifiedDetails(string description, ModifiedDetail? value = null)
    // {
    //     return await GetOrSetJsonPropertyAsync<ModifiedDetail>(description, value, td => td.ModifiedDetails, (td, v) => td.ModifiedDetails = v);
    // }

    public async Task CreateTable() => await InitialiseTableAsync();
    public async Task<int> SaveAsync(ToDoItem item, int primaryKey = 0) => await InsertOrUpdateAsync(item, primaryKey);
    public async Task<ToDoItem?> GetAsync(int primaryKey) => await FindAsync(primaryKey);
    public async Task<List<ToDoItem>> GetAllAsync() => await FindAllAsync();
    public async Task<int> DeleteAsync(ToDoItem item) => await RemoveAsync(item);
    public async Task<ToDoItem?> GetoDoItemByDescriptionAsync(string description) => await FindToDoItemByDescriptionAsync(description);
    private async Task<T> GetOrSetPropertyAsync<T>(string description, T? value, Func<ToDoItem, T> getter, Action<ToDoItem, T> setter)
    {
        ToDoItem? toDoItem = await GetoDoItemByDescriptionAsync(description);

        if (toDoItem != null && value == null)
        {
            return getter(toDoItem);
        }
        else if (toDoItem != null && value != null)
        {
            setter(toDoItem, value);
            await SaveAsync(toDoItem, toDoItem.Id);
            return value;
        }
        else if (toDoItem == null && value != null)
        {
            ToDoItem newToDoItem = new ToDoItem
            {
                Description = description
            };
            setter(newToDoItem, value);
            await SaveAsync(newToDoItem, newToDoItem.Id);
            return value;
        }
        else
        {
            return getter(new ToDoItem());
        }
    }
    private async Task<T?> GetOrSetJsonPropertyAsync<T>(string description, T? value, Func<ToDoItem, string> getter, Action<ToDoItem, string> setter) where T : new()
    {
        if (IsUnsupportedType(typeof(T)) == true)
        {
            return value == null ? default : value;
        }

        string item = string.Empty;

        if (value == null)
        {
            item = await GetOrSetPropertyAsync<string>(description, null, getter, setter);
        }
        else
        {
            string json = PropertyJsonConverter.ToJson(value);

            if (string.IsNullOrEmpty(json) == false)
            {
                item = await GetOrSetPropertyAsync<string>(description, json, getter, setter);
            }
        }

        if (string.IsNullOrEmpty(item))
        {
            return default;
        }

        return PropertyJsonConverter.FromJson<T>(item);
    }
    private bool IsUnsupportedType(Type t)
    {
        // if (t == typeof(ContentPage)) { return true; }
        // if (t == typeof(IView)) { return true; }
        // if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(List<>))
        // {
        //     Type elementType = t.GetGenericArguments()[0];
        //     if (elementType == typeof(IView)) { return true; }
        // }

        return false;
    }
}

public class ToDoListService : BaseService<ToDoList>, IToDoListService
{
    private readonly IModifiedDetailService _modifiedDetailService;
    private readonly IToDoItemService _toDoItemService;

    public ToDoListService(
        ILogger<ToDoListService> logger,
        IDatabaseService databaseService,
        IModifiedDetailService modifiedDetailService,
        IToDoItemService toDoItemService) : base(logger, databaseService)
    {
        _modifiedDetailService = modifiedDetailService;
        _toDoItemService = toDoItemService;

        // The first call to GetInitialisedDatabaseAsync initialises the encryption key and the connection.
        // Explicitly calling GetInitialisedDatabaseAsync here is not strictly necessary if the first
        // call to SaveAsync/GetAsync etc. will trigger it anyway. However, it ensures table creation
        // happens early.
        // _ = GetInitialisedDatabaseAsync();
    }

    public async Task CreateTable() => await InitialiseTableAsync();

    /// <summary>
    /// Saves a ToDoList and its associated ToDoItems and ModifiedDetails.
    /// Handles both insertion and updating of records.
    /// </summary>
    /// <param name="item">The ToDoList to save.</param>
    /// <param name="primaryKey">Optional primary key for explicit updates of the ToDoList.</param>
    /// <returns>The number of rows affected for the ToDoList (1 for success, 0 for failure).</returns>
    // public async Task<int> SaveAsync(ToDoList item, int primaryKey = 0)
    // {
    //     try
    //     {
    //         int result = await InsertOrUpdateAsync(item, primaryKey);
    //         if (result > 0 && item is not null)
    //         {
    //             if (item.Items is not null && item.Items.Count > 0)
    //             {
    //                 foreach (ToDoItem todoItem in item.Items)
    //                 {
    //                     todoItem.ToDoListId = item.Id;
    //                     await _toDoItemService.SaveAsync(todoItem, todoItem.Id);

    //                     if (todoItem.ModifiedDetails is not null)
    //                     {
    //                         todoItem.ModifiedDetails.ToDoItemId = todoItem.Id;
    //                         await _modifiedDetailService.SaveAsync(todoItem.ModifiedDetails, todoItem.ModifiedDetails.Id);
    //                     }
    //                 }
    //             }
    //         }
    //         return result;
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger?.LogError(ex, Constants.LogError_SaveUnexpectedGeneric, nameof(ToDoList));
    //         return 0;
    //     }
    // }
    public async Task<int> SaveAsync(ToDoList item, int primaryKey = 0) => await InsertOrUpdateAsync(item, primaryKey);

    /// <summary>
    /// Retrieves a ToDoList by its primary key, including its associated ToDoItems and ModifiedDetails.
    /// </summary>
    /// <param name="primaryKey">The primary key of the ToDoList to retrieve.</param>
    /// <returns>The retrieved ToDoList, or null if not found or an error occurs.</returns>
    // public async Task<ToDoList?> GetAsync(int primaryKey)
    // {
    //     try
    //     {
    //         ToDoList? toDoList = await FindAsync(primaryKey);
    //         if (toDoList is not null)
    //         {
    //             List<ToDoItem> todoItems = await _toDoItemService.GetAllAsync();
    //             if (todoItems.Count is not 0)
    //             {
    //                 todoItems = todoItems.Where(m => m.ToDoListId == toDoList.Id).ToList();
    //                 if (todoItems.Count is not 0)
    //                 {
    //                     foreach (var (todoItem, index) in todoItems.Select((todoItem, index) => (todoItem, index)))
    //                     {
    //                         List<ModifiedDetail> modifiedDetailList = await _modifiedDetailService.GetAllAsync();
    //                         if (modifiedDetailList.Count is not 0)
    //                         {
    //                             modifiedDetailList = modifiedDetailList.Where(m => m.ToDoItemId == todoItem.Id).ToList();
    //                             if (modifiedDetailList.Count is not 0)
    //                             {
    //                                 todoItem.ModifiedDetails = modifiedDetailList.FirstOrDefault();
    //                             }
    //                         }
    //                     }

    //                     toDoList.Items = todoItems;
    //                 }
    //             }
    //         }
    //         return toDoList;
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger?.LogError(ex, Constants.LogError_GetUnexpectedGeneric, nameof(ToDoList));
    //         return null;
    //     }
    // }
    public async Task<ToDoList?> GetAsync(int primaryKey) => await FindAsync(primaryKey);

    /// <summary>
    /// Retrieves all ToDoLists, including their associated ToDoItems and ModifiedDetails.
    /// </summary>
    /// <returns>A list of all ToDoLists.</returns>
    // public async Task<List<ToDoList>> GetAllAsync()
    // {
    //     try
    //     {
    //         List<ToDoList> toDoLists = await FindAllAsync();
    //         if (toDoLists.Count is not 0)
    //         {
    //             foreach (var (toDoList, index) in toDoLists.Select((toDoList, index) => (toDoList, index)))
    //             {
    //                 List<ToDoItem> todoItems = await _toDoItemService.GetAllAsync();
    //                 if (todoItems.Count is not 0)
    //                 {
    //                     todoItems = todoItems.Where(m => m.ToDoListId == toDoList.Id).ToList();
    //                     if (todoItems.Count is not 0)
    //                     {
    //                         foreach (var (todoItem, todoItemIndex) in todoItems.Select((todoItem, todoItemIndex) => (todoItem, todoItemIndex)))
    //                         {
    //                             List<ModifiedDetail> modifiedDetailList = await _modifiedDetailService.GetAllAsync();
    //                             if (modifiedDetailList.Count is not 0)
    //                             {
    //                                 modifiedDetailList = modifiedDetailList.Where(m => m.ToDoItemId == todoItem.Id).ToList();
    //                                 if (modifiedDetailList.Count is not 0)
    //                                 {
    //                                     todoItem.ModifiedDetails = modifiedDetailList.FirstOrDefault();
    //                                 }
    //                             }
    //                         }

    //                         toDoList.Items = todoItems;
    //                     }
    //                 }
    //             }
    //         }
    //         return toDoLists;
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger?.LogError(ex, Constants.LogError_GetAllUnexpectedGeneric, nameof(List<ToDoList>));
    //         return new List<ToDoList>();
    //     }
    // }
    public async Task<List<ToDoList>> GetAllAsync() => await FindAllAsync();

    /// <summary>
    /// Deletes a ToDoList, along with all its associated ToDoItems and their ModifiedDetails.
    /// </summary>
    /// <param name="item">The ToDoList to delete.</param>
    /// <returns>The number of rows affected for the ToDoList (1 for success, 0 for failure).</returns>
    // public async Task<int> DeleteAsync(ToDoList item)
    // {
    //     try
    //     {
    //         List<ToDoItem> todoItems = await _toDoItemService.GetAllAsync();
    //         if (todoItems.Count is not 0)
    //         {
    //             todoItems = todoItems.Where(m => m.ToDoListId == item.Id).ToList();
    //             if (todoItems.Count is not 0)
    //             {
    //                 foreach (ToDoItem todoItem in todoItems)
    //                 {
    //                     List<ModifiedDetail> modifiedDetailList = await _modifiedDetailService.GetAllAsync();
    //                     if (modifiedDetailList.Count is not 0)
    //                     {
    //                         ModifiedDetail? detailToDelete = modifiedDetailList.FirstOrDefault(m => m.ToDoItemId == todoItem.Id);
    //                         if (detailToDelete != null)
    //                         {
    //                             await _modifiedDetailService.DeleteAsync(detailToDelete);
    //                         }
    //                     }

    //                     await _toDoItemService.DeleteAsync(todoItem);
    //                 }
    //             }
    //         }

    //         return await RemoveAsync(item);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger?.LogError(ex, Constants.LogError_DeleteUnexpectedGeneric, nameof(ToDoList));
    //         return 0;
    //     }
    // }
    public async Task<int> DeleteAsync(ToDoList item) => await RemoveAsync(item);
}
```

### Test program

```csharp
// Program.cs
// This is the entry point for the console application.
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("Starting Database Service Test...");

        // Ensure the database file doesn't exist from previous runs for a clean test.
        // This is important for consistent testing on platforms like dotnetfiddle.net.
        if (File.Exists(Constants.DatabasePath))
        {
            File.Delete(Constants.DatabasePath);
            Console.WriteLine($"Cleaned up existing database file: {Constants.DatabasePath}");
        }

        // Setup mock loggers for each service.
        // In a real application, a dependency injection framework (like Microsoft.Extensions.DependencyInjection)
        // would handle the instantiation and injection of these services and loggers.
        ILogger<DatabaseService> databaseLogger = new ConsoleLogger<DatabaseService>();
        ILogger<ModifiedDetailService> modifiedDetailLogger = new ConsoleLogger<ModifiedDetailService>();
        ILogger<ToDoItemService> toDoItemLogger = new ConsoleLogger<ToDoItemService>();
        ILogger<ToDoListService> toDoListLogger = new ConsoleLogger<ToDoListService>();

        // Setup service instances, passing their respective loggers and any dependencies.
        IDatabaseService databaseService = new DatabaseService(databaseLogger);
        IModifiedDetailService modifiedDetailService = new ModifiedDetailService(modifiedDetailLogger, databaseService);
        await modifiedDetailService.CreateTable();
        IToDoItemService toDoItemService = new ToDoItemService(toDoItemLogger, databaseService);
        await toDoItemService.CreateTable();
        IToDoListService toDoListService = new ToDoListService(toDoListLogger, databaseService, modifiedDetailService, toDoItemService);
        await toDoListService.CreateTable();

        Console.WriteLine("\n--- Test Case 1: Create and save a ToDoList with items ---");
        // Create ModifiedDetail instances for the ToDoItems
        var modifiedDetail1 = new ModifiedDetail("User A", DateTime.Now.AddDays(-1));
        var modifiedDetail2 = new ModifiedDetail("User B", DateTime.Now);

        // Create ToDoItem instances and link them to ModifiedDetails
        var todoItem1 = new ToDoItem("Buy groceries", DateTime.Today.AddDays(2), false, modifiedDetail1);
        var todoItem2 = new ToDoItem("Finish report", DateTime.Today.AddDays(0), true, modifiedDetail2);

        // Create a ToDoList and add the ToDoItems to it
        var todoList1 = new ToDoList("Daily Tasks");
        todoList1.Items.Add(todoItem1);
        todoList1.Items.Add(todoItem2);

        Console.WriteLine($"Attempting to save ToDoList: '{todoList1.Title}' with {todoList1.Items.Count} items.");
        int saveResult = await toDoListService.SaveAsync(todoList1);
        Console.WriteLine($"Save operation result for ToDoList1: {saveResult} (expected > 0 for success).");
        Console.WriteLine($"ToDoList1 ID after save (should be populated if new): {todoList1.Id}");
        Console.WriteLine($"ToDoItem1 ID after save (should be populated if new): {todoItem1.Id}");
        Console.WriteLine($"ModifiedDetail1 ID after save (should be populated if new): {modifiedDetail1.Id}");

        if (saveResult > 0 && todoList1.Id != 0)
        {
            Console.WriteLine($"\n--- Test Case 2: Retrieve the saved ToDoList by ID ---");
            ToDoList? retrievedList = await toDoListService.GetAsync(todoList1.Id);

            if (retrievedList != null)
            {
                Console.WriteLine($"Successfully retrieved ToDoList: '{retrievedList.Title}' (ID: {retrievedList.Id})");
                Console.WriteLine($"Number of associated items: {retrievedList.Items?.Count ?? 0}");
                if (retrievedList.Items != null)
                {
                    foreach (var item in retrievedList.Items)
                    {
                        Console.WriteLine($"  - Item: '{item.Description}', Completed: {item.IsCompleted}, Due: {item.DueDate.ToShortDateString()}");
                        if (item.ModifiedDetails != null)
                        {
                            Console.WriteLine($"    Modified By: {item.ModifiedDetails.ModifiedBy} on {item.ModifiedDetails.ModifiedDate}");
                        }
                    }
                }
            }
            else
            {
                Console.WriteLine("Failed to retrieve ToDoList with the given ID.");
            }

            Console.WriteLine($"\n--- Test Case 3: Create and save another ToDoList with no items initially ---");
            var todoList2 = new ToDoList("Weekend Plans");
            int saveResult2 = await toDoListService.SaveAsync(todoList2);
            Console.WriteLine($"Save operation result for ToDoList2: {saveResult2}. ToDoList2 ID: {todoList2.Id}");

            Console.WriteLine($"\n--- Test Case 4: Retrieve all ToDoLists ---");
            List<ToDoList> allLists = await toDoListService.GetAllAsync();
            Console.WriteLine($"Retrieved {allLists.Count} ToDoLists.");
            foreach (var list in allLists)
            {
                Console.WriteLine($"- List: '{list.Title}' (ID: {list.Id}), Items Count: {list.Items?.Count ?? 0}");
            }

            Console.WriteLine($"\n--- Test Case 5: Update a ToDoItem within a retrieved ToDoList ---");
            if (retrievedList != null && retrievedList.Items != null && retrievedList.Items.Any())
            {
                var itemToUpdate = retrievedList.Items.First(); // Get the first item from the retrieved list
                Console.WriteLine($"Original item description: '{itemToUpdate.Description}' (ID: {itemToUpdate.Id})");
                itemToUpdate.Description = "Buy organic groceries and fresh produce"; // Update description
                itemToUpdate.IsCompleted = true; // Mark as completed
                // Create a new ModifiedDetail for the update.
                // Note: In a real app, you might update an existing ModifiedDetail or create a new one.
                // Here, we're creating a new one to demonstrate saving it.
                var newModifiedDetail = new ModifiedDetail("User C (Updater)", DateTime.Now.AddHours(1));
                itemToUpdate.ModifiedDetails = newModifiedDetail;

                // Save the updated ToDoItem. It should update the existing record.
                int updateItemResult = await toDoItemService.SaveAsync(itemToUpdate, itemToUpdate.Id);
                // Also save the new/updated ModifiedDetail
                await modifiedDetailService.SaveAsync(itemToUpdate.ModifiedDetails, itemToUpdate.ModifiedDetails.Id);
                Console.WriteLine($"Update item result: {updateItemResult}");

                // Re-retrieve the entire list to verify the item update and its associated details.
                Console.WriteLine($"Re-retrieving ToDoList {retrievedList.Id} to verify item update.");
                retrievedList = await toDoListService.GetAsync(retrievedList.Id);
                var updatedItem = retrievedList?.Items.FirstOrDefault(i => i.Id == itemToUpdate.Id);
                if (updatedItem != null)
                {
                    Console.WriteLine($"Verified updated item: '{updatedItem.Description}', Completed: {updatedItem.IsCompleted}");
                    if (updatedItem.ModifiedDetails != null)
                    {
                        Console.WriteLine($"    Modified By: {updatedItem.ModifiedDetails.ModifiedBy} on {updatedItem.ModifiedDetails.ModifiedDate}");
                    }
                    else
                    {
                        Console.WriteLine("    Modified Details were not loaded after update.");
                    }
                }
                else
                {
                    Console.WriteLine("Failed to find updated item after re-retrieval.");
                }
            }
            else
            {
                Console.WriteLine("No items found in the first ToDoList to demonstrate update.");
            }

            Console.WriteLine($"\n--- Test Case 6: Delete a ToDoList and its nested items ---");
            // Retrieve all lists again to ensure we have the latest state before deleting
            allLists = await toDoListService.GetAllAsync();
            if (allLists.Any(l => l.Id == todoList2.Id)) // Ensure todoList2 still exists before trying to delete
            {
                var listToDelete = allLists.First(l => l.Id == todoList2.Id); // Delete the second list created
                Console.WriteLine($"Attempting to delete ToDoList: '{listToDelete.Title}' (ID: {listToDelete.Id})");
                int deleteResult = await toDoListService.DeleteAsync(listToDelete);
                Console.WriteLine($"Delete operation result: {deleteResult} (expected > 0 for success).");

                Console.WriteLine($"\n--- Test Case 7: Verify deletion ---");
                allLists = await toDoListService.GetAllAsync();
                Console.WriteLine($"Retrieved {allLists.Count} ToDoLists after deletion. Expected 1 list remaining (ToDoList1).");
                foreach (var list in allLists)
                {
                    Console.WriteLine($"- Remaining List: '{list.Title}' (ID: {list.Id})");
                }

                // Verify that the deleted list and its items/details are truly gone
                ToDoList? deletedListCheck = await toDoListService.GetAsync(listToDelete.Id);
                Console.WriteLine($"Check for deleted list (ID {listToDelete.Id}): {(deletedListCheck == null ? "Not found (correct)" : "Found (incorrect)")}");
            }
            else
            {
                Console.WriteLine("ToDoList2 was not found, skipping deletion test for it.");
            }
        }
        else
        {
            Console.WriteLine("Initial ToDoList save failed. Cannot proceed with further tests.");
        }

        Console.WriteLine("\nDatabase Service Test Complete.");

        // Clean up the database file at the end of the test run.
        await databaseService.ClearAllTables();
        await databaseService.CloseInitialisedDatabaseAsync();
        if (File.Exists(Constants.DatabasePath))
        {
            File.Delete(Constants.DatabasePath);
            Console.WriteLine($"\nFinal cleanup: Deleted database file: {Constants.DatabasePath}");
        }
        else
        {
            Console.WriteLine("\nNo database file to clean up.");
        }
    }
}
```

## How to use it

1. Create the services and the tables, as the test program does. In a MAUI app, register the services in the dependency injection container.
2. Call `CreateTable()` on each table service before the first use.
3. Call `SaveAsync(item)` to insert an item with its children. Call `SaveAsync(item, item.Id)` to update an item.
4. Call `GetAsync(id)` or `GetAllAsync()` to read items with their children.
5. Call `DeleteAsync(item)` to delete an item with its children.
6. Call `ClearAllTables()` and `CloseInitialisedDatabaseAsync()` to clear and close the database.

The test program runs these test cases:

| Test case | Action |
| --- | --- |
| 1 | Create and save a to-do list with two items. |
| 2 | Get the saved list by its ID. |
| 3 | Create and save a second list with no items. |
| 4 | Get all lists. |
| 5 | Update an item in the list and save a new modification detail. |
| 6 | Delete the second list and its children. |
| 7 | Make sure that the second list is deleted. |

## How it works

| Area | Details |
| --- | --- |
| Encryption key | `InitialiseEncryptionKey` reads the key from SecureStorage. If there is no key, it makes a 32-character key from a GUID and stores it. |
| Connection | `Initialise` creates a `SQLiteAsyncConnection` with the database path, the flags, `StoreDateTimeAsTicks` set to `true`, and the key. If the key or the connection fails, the connection stays `null`. |
| Database file | `testlocaldatabase.db3` in `FileSystem.AppDataDirectory`. |
| Open flags | `ReadWrite`, `Create`, `FullMutex`, and `SharedCache`. |
| Locks | Each operation in `BaseService<T>` waits for one shared `SemaphoreSlim`. It prevents SQLite contention between UI operations and a background sync service. |
| Return values | Save and delete return 1 for success and 0 for failure. Read methods return `default`, `null`, or an empty list if an error occurs. |
| Logs | Information and warning logs run only in DEBUG builds. Error logs always run. |
| Clear tables | `ClearAllTables` deletes all rows from each mapped table. |

> **NOTE:** A static field in a generic class exists once for each type argument. The `DatabaseLock` class holds the lock, so all `BaseService<T>` types share one lock. No locked method calls another locked method, so the shared lock does not cause a deadlock.
