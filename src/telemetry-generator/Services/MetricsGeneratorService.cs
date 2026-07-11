using System.Diagnostics.Metrics;
using TelemetryGenerator.Models;

namespace TelemetryGenerator.Services;

public sealed class MetricsGeneratorService : BackgroundService
{
    private readonly ILogger<MetricsGeneratorService> _logger;
    private readonly Meter _meter;
    private readonly Random _random = new();
    private readonly string[] _rackIds;
    private readonly int _intervalMs;

    // Current snapshot used by ObservableGauges and /api/status
    private volatile RackMetrics[] _currentMetrics;

    public MetricsGeneratorService(
        ILogger<MetricsGeneratorService> logger,
        IMeterFactory meterFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _meter = meterFactory.Create("dc.telemetry");

        var racks = configuration.GetValue<int>("Simulator:RackCount", 4);
        _intervalMs = configuration.GetValue<int>("Simulator:IntervalMs", 5000);
        _rackIds = Enumerable.Range(1, racks).Select(i => $"rack-{i:D2}").ToArray();
        _currentMetrics = GenerateInitialMetrics();

        RegisterGauges();
    }

    public RackMetrics[] CurrentMetrics => _currentMetrics;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MetricsGeneratorService started. Interval: {Interval}ms, Racks: {Count}",
            _intervalMs, _rackIds.Length);

        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(_intervalMs));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            _currentMetrics = _rackIds.Select(id => GenerateRackMetrics(id)).ToArray();
            _logger.LogDebug("Metrics updated for {Count} racks", _currentMetrics.Length);
        }
    }

    private void RegisterGauges()
    {
        _meter.CreateObservableGauge(
            "dc.rack.temperature_celsius",
            () => _currentMetrics.Select(r => new Measurement<double>(r.TemperatureCelsius, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            unit: "Cel",
            description: "Rack inlet temperature in Celsius");

        _meter.CreateObservableGauge(
            "dc.rack.power_draw_watts",
            () => _currentMetrics.Select(r => new Measurement<double>(r.PowerDrawWatts, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            unit: "W",
            description: "Rack power draw in Watts");

        _meter.CreateObservableGauge(
            "dc.rack.cooling_load_percent",
            () => _currentMetrics.Select(r => new Measurement<double>(r.CoolingLoadPercent, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            unit: "%",
            description: "Cooling system load percentage");

        _meter.CreateObservableGauge(
            "dc.rack.gpu_utilization_percent",
            () => _currentMetrics.Select(r => new Measurement<double>(r.GpuUtilizationPercent, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            unit: "%",
            description: "GPU utilization percentage");

        _meter.CreateObservableGauge(
            "dc.rack.network_throughput_mbps",
            () => _currentMetrics.Select(r => new Measurement<double>(r.NetworkThroughputMbps, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            unit: "Mbit/s",
            description: "Network throughput in Megabits per second");

        _meter.CreateObservableGauge(
            "dc.rack.node_healthy",
            () => _currentMetrics.Select(r => new Measurement<double>(r.NodeHealthy ? 1 : 0, new KeyValuePair<string, object?>("rack_id", r.RackId))),
            description: "Node health status (1 = healthy, 0 = degraded)");
    }

    private RackMetrics GenerateRackMetrics(string rackId)
    {
        // Simulate realistic but random fluctuations
        var temperature = _random.NextDouble() * 60 + 20;   // 20–80 °C (occasionally spikes)
        if (_random.NextDouble() < 0.05) temperature += _random.NextDouble() * 20; // 5% spike to >80°C

        return new RackMetrics(
            RackId: rackId,
            TemperatureCelsius: Math.Round(temperature, 2),
            PowerDrawWatts: Math.Round(_random.NextDouble() * 3500 + 500, 2),  // 500–4000 W
            CoolingLoadPercent: Math.Round(_random.NextDouble() * 100, 2),
            GpuUtilizationPercent: Math.Round(_random.NextDouble() * 100, 2),
            NetworkThroughputMbps: Math.Round(_random.NextDouble() * 10000, 2),
            NodeHealthy: _random.NextDouble() > 0.02 // 98% healthy
        );
    }

    private RackMetrics[] GenerateInitialMetrics() =>
        _rackIds.Select(id => GenerateRackMetrics(id)).ToArray();
}
