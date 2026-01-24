import { callToAction } from "../../../config/valueProps.js";

export default function CTA() {
	const [section] = callToAction;

	return (
		<div className="max-h-9/10 grid grid-cols-3 gap-8 py-8">
			<div className="col-start-1 col-end-3 flex flex-col items-start justify-center px-8">
				<h1 className="text-4xl font-bold text-gray-50 mb-4">
					{section.headline}
				</h1>
				<p className="text-lg text-gray-200 mb-6">{section.subtitle}</p>
				<button className="bg-gray-100 text-green-950 rounded-lg px-4 py-2 font-semibold">
					<a href="#">{section.buttonText}</a>
				</button>
				{/* <div className="justify-items-end">
					<span>
						{section.reasons.map((reason, i) => {
							return (
								<span key={i}>
									{reason.icon}
									{reason.heading}
									{reason.body}
								</span>
							);
						})}
					</span>
				</div> */}
			</div>
		</div>
	);
}
