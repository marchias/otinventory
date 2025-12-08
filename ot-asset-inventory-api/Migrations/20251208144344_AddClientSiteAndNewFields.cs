using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ot_asset_inventory_api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientSiteAndNewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropPrimaryKey(
            //    name: "PK_Assets",
            //    table: "Assets");

            //migrationBuilder.AlterColumn<int>(
            //    name: "Id",
            //    table: "Assets",
            //    type: "int",
            //    nullable: false,
            //    oldClrType: typeof(int),
            //    oldType: "int")
            //    .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "MacAddress",
                table: "Assets",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Client",
                table: "Assets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IPAddress",
                table: "Assets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Model",
                table: "Assets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Site",
                table: "Assets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            //migrationBuilder.AddPrimaryKey(
            //    name: "PK_Assets",
            //    table: "Assets",
            //    column: "MacAddress");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Assets",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "MacAddress",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Client",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "IPAddress",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Model",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Site",
                table: "Assets");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Assets",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Assets",
                table: "Assets",
                column: "Id");
        }
    }
}
