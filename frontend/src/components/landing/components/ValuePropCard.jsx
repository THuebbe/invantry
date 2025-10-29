export default function ValuePropCard({ icon, title, bullets }) {
	const Icon = icon;

	return (
		<div className="valuePropCard">
			<div className="title">
				<span>
					<Icon />
				</span>
				{title}
			</div>
			<div className="content">
				<ul className="valueList">
					{bullets.map((bullet, i) => (
						<li
							key={i}
							className="bullet"
						>
							{bullet}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
