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

<<<<<<< Updated upstream
export function Dashboard() {
  const data = {
    labels: ["0-25", "26-50", "51-75", "76-100"],
    datasets: [{ label: "Submissions", data: [1, 2, 3, 4] }],
=======
export type ScoreBucket = { bucket: string; count: number };

export function Dashboard(props: { scores: ScoreBucket[] }) {
  const labels = props.scores.map((b) => b.bucket);
  const counts = props.scores.map((b) => b.count);

  const data = {
    labels,
    datasets: [{ label: "Submissions", data: counts }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Scores distribution" },
    },
>>>>>>> Stashed changes
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>
<<<<<<< Updated upstream
      <Bar data={data} />
=======
      <Bar data={data} options={options} />
>>>>>>> Stashed changes
    </div>
  );
}
