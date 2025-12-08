namespace OtAssetInventoryApi.Models
{
    public class AssetEntity
    {       
        public string Guid { get; set; } = null!; // client-side GUID
        public string Name { get; set; } = null!;
        public string? Location { get; set; }
        public string? Description { get; set; }
        public string? ImageDataUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public bool IsDirty { get; set; }   // optional: track server dirty state
        public bool IsDeleted { get; set; } // soft delete flag (for server side)

        public string? Client { get; set; }
        public string? Site { get; set; }
        public string? Model { get; set; }
        public string? MacAddress { get; set; }
        public string? IPAddress { get; set; }
    }
}
