import { credentials } from "../../../config/valueProps.js";

export default function Credentials() {
	const [section] = credentials;

	return (
		<div className="max-h-9/10 grid grid-cols-3 gap-8 py-8">
			<div className="col-start-1 col-end-3 flex flex-col items-start justify-center px-8">
				<h1 className="text-4xl font-bold text-gray-50 mb-4">
					{section.headline}
				</h1>
				<p className="text-lg text-gray-200 mb-6">{section.bodyCopy}</p>
				<p className="text-lg text-gray-200 mb-6">{section.problem}</p>
				<p className="text-lg text-gray-200 mb-6">{section.difference}</p>
				<p className="text-lg text-gray-200 mb-6">{section.mission}</p>
			</div>
		</div>
	);
}
