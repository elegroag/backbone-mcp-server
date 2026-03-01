/**
 * EJEMPLO: Cómo usar las nuevas tools del MCP para crear componentes
 * 
 * Este archivo muestra ejemplos de cómo llamar a las tools registradas
 * en el servidor MCP desde un cliente.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function exampleCreateComponent() {
    // Conectar al servidor MCP
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/server.js"]
    });

    const client = new Client({
        name: "example-client",
        version: "1.0.0"
    });

    await client.connect(transport);

    // ============================================
    // EJEMPLO 1: Listar tipos de componentes disponibles
    // ============================================
    console.log("\n=== EJEMPLO 1: Listar tipos de componentes ===");

    try {
        const typesResponse = await client.callTool("list-component-types", {});
        console.log("Tipos disponibles:");
        console.log(typesResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 2: Crear un modelo
    // ============================================
    console.log("\n=== EJEMPLO 2: Crear un modelo de usuario ===");

    try {
        const modelResponse = await client.callTool("create-component", {
            componentName: "User",
            componentType: "model",
            outputPath: "./src/models/User.ts"
        });
        console.log("Respuesta:");
        console.log(modelResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 3: Crear un controlador
    // ============================================
    console.log("\n=== EJEMPLO 3: Crear un controlador de productos ===");

    try {
        const controllerResponse = await client.callTool("create-component", {
            componentName: "ProductController",
            componentType: "controller",
            outputPath: "./src/controllers/ProductController.ts"
        });
        console.log("Respuesta:");
        console.log(controllerResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 4: Crear una vista
    // ============================================
    console.log("\n=== EJEMPLO 4: Crear una vista de dashboard ===");

    try {
        const viewResponse = await client.callTool("create-component", {
            componentName: "Dashboard",
            componentType: "view",
            outputPath: "./src/views/DashboardView.ts"
        });
        console.log("Respuesta:");
        console.log(viewResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 5: Crear una colección
    // ============================================
    console.log("\n=== EJEMPLO 5: Crear una colección de órdenes ===");

    try {
        const collectionResponse = await client.callTool("create-component", {
            componentName: "Order",
            componentType: "collection",
            outputPath: "./src/collections/OrderCollection.ts"
        });
        console.log("Respuesta:");
        console.log(collectionResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 6: Error - nombre inválido
    // ============================================
    console.log("\n=== EJEMPLO 6: Intento con nombre inválido ===");

    try {
        const errorResponse = await client.callTool("create-component", {
            componentName: "123Invalid",
            componentType: "model",
            outputPath: "./src/models/Invalid.ts"
        });
        console.log("Respuesta:");
        console.log(errorResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    // ============================================
    // EJEMPLO 7: Error - tipo no soportado
    // ============================================
    console.log("\n=== EJEMPLO 7: Intento con tipo no soportado ===");

    try {
        const errorResponse = await client.callTool("create-component", {
            componentName: "MyComponent",
            componentType: "unknownType",
            outputPath: "./src/MyComponent.ts"
        });
        console.log("Respuesta:");
        console.log(errorResponse);
    } catch (error) {
        console.error("Error:", error);
    }

    await client.close();
}

// Ejecutar ejemplos
exampleCreateComponent().catch(console.error);
