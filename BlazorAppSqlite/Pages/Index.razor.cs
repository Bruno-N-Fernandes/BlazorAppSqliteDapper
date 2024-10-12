using BlazorAppSqlite.Data;
using Microsoft.AspNetCore.Components;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using System;
using Dapper;

namespace BlazorAppSqlite.Pages
{
	[Route("/")]
	public partial class Index
	{
		[Inject]
		private IDbConnection dbConnection { get; set; }

        [Inject]
        public BlazorMemoryFileSystem BlazorMemoryFileSystem { get; set; }

        private List<Wave> storedWaves = new();

		protected override async Task OnInitializedAsync()
		{
			base.OnInitialized();
			await LoadData();
		}

		private async Task Download()
		{
			await BlazorMemoryFileSystem.DownloadSqliteFromMemoryFileSystem();
		}

		private async Task LoadData()
		{
			var waves = await dbConnection.QueryAsync<Wave>("Select * From Waves");

			storedWaves.Clear();
			storedWaves.AddRange(waves);

			await InvokeAsync(() => StateHasChanged());
		}

		private async Task SaveData()
		{
			var wave = new Wave { Name = "Bells", Country = Guid.NewGuid().ToString() };
			wave.Id = await dbConnection.ExecuteScalarAsync<int>("Insert Into Waves (Name, Country) Values (@Name, @Country); Select Last_Insert_RowId() As Id;", wave);

			await LoadData();
		}


	}
}