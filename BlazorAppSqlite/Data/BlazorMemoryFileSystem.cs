using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using System.Data;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace BlazorAppSqlite.Data
{
	/// <summary>
	/// This service synchronizes the Sqlite DB with both the backend server and the browser's IndexedDb storage
	/// </summary>
	public class BlazorMemoryFileSystem
	{
		public const int SqliteDbVersion = 4;
		public static readonly string SqliteDbFilename = $"./db/v{SqliteDbVersion}/MyDatabase.sqlite";

		private readonly Task firstTimeSetupTask;
		private IJSObjectReference _module;

		private bool IsBrowser => RuntimeInformation.IsOSPlatform(OSPlatform.Create("browser"));

		public BlazorMemoryFileSystem(IJSRuntime js, IDbConnection dbConnection)
		{
			firstTimeSetupTask = FirstTimeSetupAsync(js, dbConnection);
		}

		public async Task StartDataSynchronizerAsync() => await firstTimeSetupTask;

		/// <summary>
		/// This JS file constantly monitors the MEMFS file and synchronize our sqlite db with a indexedDB stored file
		/// </summary>
		/// <param name="js"></param>
		/// <param name="dbConnection"></param>
		/// <returns></returns>
		private async Task FirstTimeSetupAsync(IJSRuntime js, IDbConnection dbConnection)
		{
			_module = await js.InvokeAsync<IJSObjectReference>("import", "./blazor-memory-file-system.js");
			await SynchronizeMemoryFileSystemWithIndexedDb(SqliteDbFilename, SqliteDbVersion);

			// Essa parte daqui precisa ser refatorada...
			await dbConnection.ExecuteAsync("Create Table If Not Exists Waves (Id Integer Primary Key Asc AutoIncrement Not Null, Name Text Not Null, Country Text Not Null);");
		}

		private async Task SynchronizeMemoryFileSystemWithIndexedDb(string filename, int dbVersion)
		{
			if (IsBrowser)
				await _module.InvokeVoidAsync("synchronizeMemoryFileSystemWithIndexedDb", filename, dbVersion);
		}

		public async Task DownloadSqliteFromMemoryFileSystem()
		{
			if (IsBrowser)
				await _module.InvokeVoidAsync("downloadSqliteFromMemoryFileSystem", SqliteDbFilename);
		}
	}

	public static class DataSynchronizerExtensions
	{
		public static void AddDataSynchronizer(this IServiceCollection serviceCollection)
		{
			serviceCollection.AddScoped<IDbConnection>(x => new SqliteConnection($"Filename={BlazorMemoryFileSystem.SqliteDbFilename}"));
			serviceCollection.AddScoped<BlazorMemoryFileSystem>();
		}
	}
}