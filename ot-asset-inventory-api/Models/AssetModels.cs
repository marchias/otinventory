namespace OtAssetInventoryApi.Models;

public record AssetDto(
    string Guid,
    string Name,
    string? Location,
    string? Description,
    string? ImageDataUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDirty,
    bool? IsDeleted
);

public record SyncRequest(List<AssetDto> Assets);

public record SyncResponse(List<string> SyncedGuids);
