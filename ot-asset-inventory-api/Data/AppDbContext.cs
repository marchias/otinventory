using Microsoft.EntityFrameworkCore;
using OtAssetInventoryApi.Models;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace OtAssetInventoryApi.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<AssetEntity> Assets => Set<AssetEntity>();

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var asset = modelBuilder.Entity<AssetEntity>();

            asset.ToTable("Assets");

            asset.HasKey(a => a.Id);

            asset.HasIndex(a => a.Guid)
                 .IsUnique();

            asset.Property(a => a.Guid)
                 .IsRequired()
                 .HasMaxLength(64);

            asset.Property(a => a.Name)
                 .IsRequired()
                 .HasMaxLength(200);

            asset.Property(a => a.Location)
                 .HasMaxLength(200);

            // others default to nvarchar(max) / bit / datetime2
        }
    }
}
