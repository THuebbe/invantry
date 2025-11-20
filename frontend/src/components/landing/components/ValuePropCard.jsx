import { Card, CardHeader, CardBody, Image, Button } from "@heroui/react";
import "./ValuePropCard.css";

export default function ValuePropCard({ icon, title, bullets }) {
	const Icon = icon;

	return (
		<div className="card">
			<div className="card__border"></div>
			<div className="card_title__container">
				<span className="card_title">{title}</span>
				<p className="card_paragraph">
					Perfect for your next content, leave to us and enjoy the result!
				</p>
			</div>
			<hr className="line" />
			<ul className="card__list">
				{bullets.map((bullet, i) => (
					<li
						key={i}
						className="card__list_item"
					>
						<span className="check">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								className="check_svg"
							>
								<path
									fillRule="evenodd"
									d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
									clipRule="evenodd"
								></path>
							</svg>
						</span>
						<span className="list_text">{bullet}</span>
					</li>
				))}
			</ul>
			<button className="button">Book a Call</button>
		</div>
	);

	// return (
	// 	<div className="valuePropCard">
	// 		<Card
	// 			isBlurred
	// 			className="border-none bg-background/60 dark:bg-default-100/50 max-w-[610px]"
	// 			shadow="sm"
	// 		>
	// 			<CardBody>
	// 				<div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
	// 					<div className="relative col-span-6 md:col-span-4">
	// 						<Image
	// 							alt="Album cover"
	// 							className="object-cover"
	// 							height={200}
	// 							shadow="md"
	// 							src="https://heroui.com/images/album-cover.png"
	// 							width="100%"
	// 						/>
	// 					</div>

	// 					<div className="flex flex-col col-span-6 md:col-span-8">
	// 						<CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
	// 							<p className="text-tiny uppercase font-bold">
	// 								<span>
	// 									<Icon />
	// 								</span>
	// 								{title}
	// 							</p>
	// 						</CardHeader>
	// 						<div className="flex justify-between items-start">
	// 							<ul className="flex flex-col gap-0">
	// 								{bullets.map((bullet, i) => (
	// 									<li
	// 										key={i}
	// 										className="text-small text-foreground/80"
	// 									>
	// 										{bullet}
	// 									</li>
	// 								))}
	// 							</ul>
	// 						</div>

	// 						<div className="flex flex-col mt-3 gap-1">
	// 							<div className="flex justify-between">
	// 								<p className="text-small">1:23</p>
	// 								<p className="text-small text-foreground/50">4:32</p>
	// 							</div>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</CardBody>
	// 		</Card>
	// 		<div className="title">{title}</div>
	// 		<div className="content">
	// 			<ul className="valueList">
	// 				{bullets.map((bullet, i) => (
	// 					<li
	// 						key={i}
	// 						className="bullet"
	// 					>
	// 						{bullet}
	// 					</li>
	// 				))}
	// 			</ul>
	// 		</div>
	// 	</div>
	// );
}
