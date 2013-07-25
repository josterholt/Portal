portalType = new breeze.EntityType({ shortName: "post", namespace: "portal" });
portalType.addProperty(new breeze.NavigationProperty({ name: "user", entityTypeName: "User:#portal", isScalar: true, associationName: "user", foreignKeyNames: ["userId"] }));
portalType.addProperty(new breeze.DataProperty({ name: "userId", dataType: breeze.DataType.Integer }));