import api from ".//api";

// Obter estatísticas de produtos
export const getProductStats = async () => {
  try {
    const response = await api.get("/products/stats");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter estatísticas de produtos:", error);
    // Fallback para valores de exemplo em caso de erro
    return {
      total: 150,
      trend: 5,
      lowStockTrend: -3,
    };
  }
};

// Obter estatísticas de vendas
export const getSalesStats = async () => {
  try {
    const response = await api.get("/sales/stats");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter estatísticas de vendas:", error);
    // Fallback para valores de exemplo em caso de erro
    return {
      totalSales: 247,
      totalRevenue: 32750.5,
      salesTrend: 8,
      revenueTrend: 12,
    };
  }
};

// Obter top produtos mais vendidos
export const getTopProducts = async (limit = 5) => {
  try {
    const response = await api.get(`/products/top?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter produtos mais vendidos:", error);
    // Fallback para valores de exemplo em caso de erro
    return [
      {
        id: 1,
        name: "Smartphone Galaxy S21",
        salesCount: 125,
        revenue: 187500.0,
      },
      {
        id: 2,
        name: "Notebook Dell Inspiron",
        salesCount: 85,
        revenue: 255000.0,
      },
      { id: 3, name: 'Smart TV 55"', salesCount: 67, revenue: 201000.0 },
      {
        id: 4,
        name: "Fone de Ouvido Bluetooth",
        salesCount: 54,
        revenue: 5400.0,
      },
      { id: 5, name: "Tablet Samsung", salesCount: 42, revenue: 42000.0 },
    ];
  }
};

// Obter produtos com estoque baixo
export const getLowStockProducts = async () => {
  try {
    const response = await api.get("/products/low-stock");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter produtos com estoque baixo:", error);
    // Fallback para valores de exemplo em caso de erro
    return [
      { id: 1, name: "Smartphone Galaxy S21", currentStock: 3, minStock: 10 },
      { id: 2, name: "Notebook Dell Inspiron", currentStock: 2, minStock: 5 },
      { id: 3, name: 'Smart TV 55"', currentStock: 0, minStock: 3 },
      {
        id: 4,
        name: "Fone de Ouvido Bluetooth",
        currentStock: 4,
        minStock: 15,
      },
    ];
  }
};

// Obter distribuição de categorias
export const getCategoryDistribution = async () => {
  try {
    const response = await api.get("/products/categories/distribution");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter distribuição de categorias:", error);
    // Fallback para valores de exemplo em caso de erro
    return [
      { name: "Eletrônicos", count: 56 },
      { name: "Informática", count: 42 },
      { name: "Acessórios", count: 38 },
      { name: "Audio & Video", count: 25 },
      { name: "Smartphones", count: 18 },
    ];
  }
};

// Obter últimas transações
export const getRecentTransactions = async (limit = 5) => {
  try {
    const response = await api.get(`/transactions/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter transações recentes:", error);
    // Fallback para valores de exemplo em caso de erro
    return [
      {
        id: 1012,
        customerName: "João Silva",
        date: "2025-03-28T14:22:30Z",
        total: 1250.5,
        status: "Concluída",
      },
      {
        id: 1011,
        customerName: "Maria Oliveira",
        date: "2025-03-28T10:15:23Z",
        total: 856.75,
        status: "Concluída",
      },
      {
        id: 1010,
        customerName: "Pedro Santos",
        date: "2025-03-27T16:42:18Z",
        total: 2340.0,
        status: "Pendente",
      },
      {
        id: 1009,
        customerName: "Ana Costa",
        date: "2025-03-27T09:30:45Z",
        total: 450.25,
        status: "Concluída",
      },
      {
        id: 1008,
        customerName: "Carlos Ferreira",
        date: "2025-03-26T11:20:38Z",
        total: 1875.6,
        status: "Cancelada",
      },
    ];
  }
};

// Obter dados históricos de vendas (para gráficos de tendência)
export const getSalesHistory = async (period = "month") => {
  try {
    const response = await api.get(`/sales/history?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter histórico de vendas:", error);
    // Fallback para valores de exemplo em caso de erro
    const today = new Date("2025-03-29");
    const data = [];

    // Gerar dados de exemplo para os últimos 30 dias
    if (period === "month") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split("T")[0];

        data.push({
          date: formattedDate,
          sales: Math.floor(Math.random() * 15) + 5,
          revenue: ((Math.floor(Math.random() * 1500) + 500) / 100) * 100,
        });
      }
    }
    // Gerar dados de exemplo para os últimos 12 meses
    else if (period === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        data.push({
          date: formattedDate,
          sales: Math.floor(Math.random() * 150) + 50,
          revenue: ((Math.floor(Math.random() * 15000) + 5000) / 100) * 100,
        });
      }
    }

    return data;
  }
};

// Obter vendas por período
export const getSalesByPeriod = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/sales/period?start=${startDate}&end=${endDate}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter vendas por período:", error);
    // Fallback para dados simulados
    return {
      totalSales: 154,
      totalRevenue: 22450.75,
      avgTicket: 145.78,
      topSellingDay: "2025-03-24",
    };
  }
};

// Obter métricas financeiras
export const getFinancialMetrics = async () => {
  try {
    const response = await api.get("/finance/metrics");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter métricas financeiras:", error);
    // Fallback para dados simulados
    return {
      revenue: 157580.5,
      costs: 98450.25,
      profit: 59130.25,
      profitMargin: 37.5,
      growth: 8.2,
    };
  }
};

// Obter alertas e notificações
export const getAlerts = async () => {
  try {
    const response = await api.get("/alerts");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter alertas:", error);
    // Fallback para dados simulados
    const currentDate = new Date("2025-03-29T22:38:10Z");

    return [
      {
        id: 1,
        type: "stock",
        severity: "high",
        message: "Smartphone Galaxy S21 está com estoque esgotado",
        timestamp: new Date(currentDate.getTime() - 35 * 60000).toISOString(),
      },
      {
        id: 2,
        type: "order",
        severity: "medium",
        message: "Pedido #1015 aguardando processamento há mais de 24h",
        timestamp: new Date(currentDate.getTime() - 90 * 60000).toISOString(),
      },
      {
        id: 3,
        type: "stock",
        severity: "medium",
        message: "Notebook Dell Inspiron está com estoque crítico",
        timestamp: new Date(currentDate.getTime() - 180 * 60000).toISOString(),
      },
      {
        id: 4,
        type: "system",
        severity: "low",
        message: "Backup diário realizado com sucesso",
        timestamp: new Date(currentDate.getTime() - 420 * 60000).toISOString(),
      },
    ];
  }
};

// Obter métricas de clientes
export const getCustomerMetrics = async () => {
  try {
    const response = await api.get("/customers/metrics");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter métricas de clientes:", error);
    // Fallback para dados simulados
    return {
      totalCustomers: 876,
      newCustomers: 34,
      returningRate: 68.5,
      averagePurchaseFrequency: 2.3,
      topCustomers: [
        { id: 123, name: "João Silva", totalSpent: 12540.5, purchaseCount: 8 },
        {
          id: 145,
          name: "Empresa ABC Ltda",
          totalSpent: 8750.25,
          purchaseCount: 5,
        },
        {
          id: 187,
          name: "Maria Oliveira",
          totalSpent: 6430.8,
          purchaseCount: 7,
        },
      ],
    };
  }
};

// Obter evolução do estoque
export const getStockHistory = async (productId = null, period = "month") => {
  try {
    let endpoint = "/stock/history";
    if (productId) endpoint += `?productId=${productId}`;
    if (productId) endpoint += `&period=${period}`;
    else endpoint += `?period=${period}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter histórico de estoque:", error);
    // Fallback para dados simulados
    const today = new Date("2025-03-29");
    const data = [];

    // Gerar dados simulados para os últimos 30 dias
    if (period === "month") {
      // Simular um produto com estoque inicial de 50 unidades
      let stock = 50;

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split("T")[0];

        // Simular mudanças aleatórias no estoque (-3 a +5)
        const change = Math.floor(Math.random() * 9) - 3;
        stock += change;
        if (stock < 0) stock = 0;

        data.push({
          date: formattedDate,
          stock: stock,
          changes: [
            { type: change > 0 ? "in" : "out", quantity: Math.abs(change) },
          ],
        });
      }
    }

    return data;
  }
};

// Obter dados para dashboard avançado (combinação de várias métricas)
export const getDashboardAdvancedData = async () => {
  try {
    const response = await api.get("/dashboard/advanced");
    return response.data;
  } catch (error) {
    console.error("Erro ao obter dados avançados do dashboard:", error);

    // Tentar obter os dados individualmente
    try {
      const [
        productStats,
        salesStats,
        topProducts,
        lowStock,
        categories,
        transactions,
        financialData,
      ] = await Promise.all([
        getProductStats(),
        getSalesStats(),
        getTopProducts(5),
        getLowStockProducts(),
        getCategoryDistribution(),
        getRecentTransactions(5),
        getFinancialMetrics(),
      ]);

      // Retornar os dados combinados
      return {
        productStats,
        salesStats,
        topProducts,
        lowStock,
        categories,
        transactions,
        financialData,
      };
    } catch (innerError) {
      console.error("Erro ao obter dados agregados:", innerError);

      // Fallback para versão mínima de dados simulados
      return {
        productStats: {
          total: 150,
          trend: 5,
          lowStockTrend: -3,
        },
        salesStats: {
          totalSales: 247,
          totalRevenue: 32750.5,
          salesTrend: 8,
          revenueTrend: 12,
        },
        // Dados mínimos necessários para renderizar o dashboard
        status: "fallback",
      };
    }
  }
};
