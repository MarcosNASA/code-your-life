import { useEffect, useState } from "react";
import "./App.css";
import { apiClient } from "./utils/api";
import { useAuth } from "./hooks/useAuth";
import {
	useCreateLifeHistory,
	useDeleteLifeHistory,
	useGetUserLifeHistories,
} from "./services/lifeHistory";
import { useGetCurrentUser } from "./services/user";
import type { CurrentUser, InsertLifeHistory } from "./types";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Modal } from "./components/Modal";

function App() {
	const [text, setText] = useState("");
	const getCurrentUser = useGetCurrentUser();
	const { signInWithGoogle, signOut } = useAuth();
	const deleteLifeHistory = useDeleteLifeHistory();
	const createLifeHistory = useCreateLifeHistory();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const getUserLifeHistories = useGetUserLifeHistories();
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

	const handleCreateLifeHistory = async () => {
		if (createLifeHistory.isPending) return;

		if (!currentUser) {
			console.error("User is not authenticated");
			return;
		}

		const newLifeHistory: InsertLifeHistory = {
			event_text: text,
			user_id: currentUser?.id,
			// rest of the fields:
			// event_date,
			// event_image,
		};

		createLifeHistory.mutate(newLifeHistory);
		setText("");
	};

	useEffect(() => {
		const {
			data: { subscription },
		} = apiClient.auth.onAuthStateChange((_event, session) => {
			if (session?.user.id) {
				try {
					getCurrentUser.mutateAsync(session.user.id).then((user) => {
						if (user) setCurrentUser(user);
					});
				} catch (error) {
					console.error(error);
				}
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [getCurrentUser]);

	if (!currentUser) {
		return (
			<button type="button" onClick={signInWithGoogle}>
				{getCurrentUser.isPending ? "Loading..." : "Iniciar sesión con Google"}
			</button>
		);
	}

	return (
		<main className="flex flex-col items-center justify-center h-screen min-h-full gap-8 py-20">
			<Header currentUser={currentUser} />

			<section className="max-w-6xl w-full mx-auto flex flex-col gap-4 flex-1 items-center">
				{createLifeHistory.isPending ? (
					<p>Loading...</p>
				) : createLifeHistory.isError ? (
					<p>Error: {createLifeHistory.error.message}</p>
				) : null}

				{deleteLifeHistory.isPending ? (
					<p>Loading...</p>
				) : deleteLifeHistory.isError ? (
					<p>Error: {deleteLifeHistory.error.message}</p>
				) : null}

				<h2 className="font-bold">Your life histories:</h2>
				{getUserLifeHistories.isPending ? (
					<p>Loading...</p>
				) : getUserLifeHistories.isError ? (
					<p>Error: {getUserLifeHistories.error.message}</p>
				) : getUserLifeHistories.isSuccess ? (
					<ul className="list-disc">
						{getUserLifeHistories?.data?.map((lifeHistory) => (
							<li key={lifeHistory.id} className="flex gap-1">
								<p>{lifeHistory.event_text}</p>
								<button
									type="button"
									onClick={() => {
										deleteLifeHistory.mutate(lifeHistory.id);
									}}
									className="text-red-500"
								>
									Delete
								</button>
							</li>
						))}
					</ul>
				) : null}

				{/* <button
					type="button"
					className="border-2 border-red w-max hover:bg-slate-200 px-10 py-2"
					onClick={() => {
						setIsOpen(!isOpen);
					}}
				>
					{isOpen ? "Close" : "Create a new life history"}
				</button> */}

				{!!isOpen && (
					<Modal
						text={text}
						setText={setText}
						handleCreateLifeHistory={handleCreateLifeHistory}
						createLifeHistory={createLifeHistory}
					/>
				)}
			</section>
			<Footer signOut={signOut} />
		</main>
	);
}

export default App;
