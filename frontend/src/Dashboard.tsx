import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function Dashboard() {
  const data = {
    labels: ["0-25", "26-50", "51-75", "76-100"],
    datasets: [{ label: "Submissions", data: [1, 2, 3, 4] }],
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>
      <Bar data={data} />
    </div>
  );
}
