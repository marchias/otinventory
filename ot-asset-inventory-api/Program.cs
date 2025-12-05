using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OtAssetInventoryApi.Data;
using OtAssetInventoryApi.Models;

var builder = WebApplication.CreateBuilder(args);

// CORS
//var allowedOriginsSetting = builder.Configuration["AllowedFrontendOrigins"]
//    ?? "http://localhost:5173";

//var allowedOrigins = allowedOriginsSetting
//    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// EF Core - Azure SQL / local SQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

app.UseCors();

/* ---------------------------------------------------
 *  Endpoints
 * --------------------------------------------------- */

app.MapPost("/api/assets/sync", async ([FromBody] SyncRequest request, AppDbContext db) =>
{
    var syncedGuids = new List<string>();
    try
    {
        foreach (var dto in request.Assets)
        {
            // Look up by client GUID
            var existing = await db.Assets
                .SingleOrDefaultAsync(a => a.Guid == dto.Guid);

            // Handle deletion
            if (dto.IsDeleted == true)
            {
                if (existing != null)
                {
                    // Option 1: hard delete
                    // db.Assets.Remove(existing);

                    // Option 2: soft delete on server
                    existing.IsDeleted = true;
                    existing.IsDirty = false;
                    existing.UpdatedAt = dto.UpdatedAt;
                }

                syncedGuids.Add(dto.Guid);
                continue;
            }

            if (existing == null)
            {
                // Insert
                var entity = new AssetEntity
                {
                    Guid = dto.Guid,
                    Name = dto.Name,
                    Location = dto.Location,
                    Description = dto.Description,
                    ImageDataUrl = dto.ImageDataUrl,
                    CreatedAt = dto.CreatedAt,
                    UpdatedAt = dto.UpdatedAt,
                    IsDirty = false,
                    IsDeleted = false
                };

                await db.Assets.AddAsync(entity);
            }
            else
            {
                // Update
                existing.Name = dto.Name;
                existing.Location = dto.Location;
                existing.Description = dto.Description;
                existing.ImageDataUrl = dto.ImageDataUrl;
                existing.UpdatedAt = dto.UpdatedAt;
                existing.IsDirty = false;
                existing.IsDeleted = false;
            }

            syncedGuids.Add(dto.Guid);
        }
    }
    catch (Exception ex) { 

        return Results.BadRequest(ex);
    
    }

    await db.SaveChangesAsync();

    return Results.Ok(new SyncResponse(syncedGuids));
});

app.Run();
