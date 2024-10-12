using BlazorAppSqlite;
using BlazorAppSqlite.Data;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Net.Http;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddDataSynchronizer();

var host = builder.Build();

var blazorMemoryFileSystem = host.Services.GetRequiredService<BlazorMemoryFileSystem>();
await blazorMemoryFileSystem.StartDataSynchronizerAsync();

await host.RunAsync();