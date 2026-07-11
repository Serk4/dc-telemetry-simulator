namespace TelemetryGenerator.Models;

public sealed record RackMetrics(
    string RackId,
    double TemperatureCelsius,
    double PowerDrawWatts,
    double CoolingLoadPercent,
    double GpuUtilizationPercent,
    double NetworkThroughputMbps,
    bool NodeHealthy
);
