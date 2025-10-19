// App.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { userDataLoader } from "./core/loaders/userDataLoader";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
			cacheTime: 1000 * 60 * 10, // Cache persists for 10 minutes
			refetchOnWindowFocus: false, // Don't refetch when window regains focus
			retry: 1, // Retry failed requests once
		},
	},
});

const router = createBrowserRouter([
	{
		path: "/dashboard",
		element: <Dashboard />,
		loader: userDataLoader,
	},
	// other routes...
]);

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			{/* DevTools - remove in production or leave, it won't show in prod builds */}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

export default App;
