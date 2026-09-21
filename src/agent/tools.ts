export function getOrder(orderId: string) {
    console.log(`🔧 getOrder called with: ${orderId}`);

    // For now, pretend this came from a database
    return {
        orderId,
        status: "shipped",
        customer: "Aashish",
        total: 2499,
        estimatedDelivery: "2026-09-23",
    };
}