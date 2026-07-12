using System.Diagnostics;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using TelemetryGenerator.Models;
using TelemetryGenerator.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Service info ─────────────────────────────────────────────────────────────
const string ServiceName = "dc-telemetry-generator";
const string ServiceVersion = "1.0.0";

// ── Logging ──────────────────────────────────────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddOpenTelemetry(logging =>
{
    logging.IncludeScopes = true;
    logging.IncludeFormattedMessage = true;
});
builder.Logging.AddConsole();

// ── OpenTelemetry ─────────────────────────────────────────────────────────────
var resource = ResourceBuilder.CreateDefault()
    .AddService(ServiceName, serviceVersion: ServiceVersion);

builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(resource)
        .AddSource(ServiceName)
        .AddAspNetCoreInstrumentation())
    .WithMetrics(metrics => metrics
        .SetResourceBuilder(resource)
        .AddMeter("dc.telemetry")
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddPrometheusExporter());

// ── Background service ────────────────────────────────────────────────────────
builder.Services.AddSingleton<MetricsGeneratorService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<MetricsGeneratorService>());

// ── Activity source (traces) ──────────────────────────────────────────────────
var activitySource = new ActivitySource(ServiceName);
builder.Services.AddSingleton(activitySource);

var app = builder.Build();

// ── Prometheus scrape endpoint ────────────────────────────────────────────────
app.MapPrometheusScrapingEndpoint("/metrics");

// ── Status endpoint ───────────────────────────────────────────────────────────
app.MapGet("/api/status", (MetricsGeneratorService svc, ActivitySource src) =>
{
    using var activity = src.StartActivity("GetStatus");

    var racks = svc.CurrentMetrics;
    var response = new StatusResponse(
        Status: "ok",
        Timestamp: DateTimeOffset.UtcNow,
        RackCount: racks.Length,
        Racks: racks
    );

    return Results.Ok(response);
})
.WithName("GetStatus")
.WithSummary("Returns current simulated data center telemetry snapshot");

// ── Health ────────────────────────────────────────────────────────────────────
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }))
   .WithName("Healthz");

app.Run();
