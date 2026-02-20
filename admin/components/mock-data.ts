export const mockReports = [
  {
    id: "1",
    title: "Q4 Financial Report",
    category: "Finance",
    status: "completed",
    createdDate: "2024-01-15",
  },
  {
    id: "2",
    title: "Sales Performance Analysis",
    category: "Sales",
    status: "in-process",
    createdDate: "2024-01-14",
  },
  {
    id: "3",
    title: "Marketing Campaign Review",
    category: "Marketing",
    status: "pending",
    createdDate: "2024-01-13",
  },
  {
    id: "4",
    title: "HR Compliance Audit",
    category: "HR",
    status: "completed",
    createdDate: "2024-01-12",
  },
  {
    id: "5",
    title: "Customer Satisfaction Survey",
    category: "Operations",
    status: "pending",
    createdDate: "2024-01-11",
  },
  {
    id: "6",
    title: "IT Infrastructure Report",
    category: "IT",
    status: "in-process",
    createdDate: "2024-01-10",
  },
];

export const mockStats = {
  total: 24,
  pending: 5,
  inProcess: 8,
  completed: 11,
};

export const getReportById = (id: string) => {
  return mockReports.find((report) => report.id === id) || mockReports[0];
};
