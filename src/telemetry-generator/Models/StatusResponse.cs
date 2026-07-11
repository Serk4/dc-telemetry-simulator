namespace TelemetryGenerator.Models;

public sealed record StatusResponse(
    string Status,
    DateTimeOffset Timestamp,
    int RackCount,
    IReadOnlyList<RackMetrics> Racks
);
