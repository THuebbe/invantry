import ValuePropCard from "../components/ValuePropCard";
import { valueProps } from "../../../config/valueProps";

export default function ValueProp() {
	return (
		<div>
			<h2>Answer 15 Questions to unlock your personalized roadmap for:</h2>
			<div className="valuecards">
				{valueProps.map((value) => {
					const key = value.id;
					const icon = value.icon;
					const title = value.title;
					const bulletList = value.bullets;

					return (
						<ValuePropCard
							key={key}
							icon={icon}
							title={title}
							bullets={bulletList}
						/>
					);
				})}
			</div>
		</div>
	);
}
