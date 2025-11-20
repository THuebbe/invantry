// frontend\src\pages\Landing.jsx

import Hook from "../components/landing/sections/Hook";
import ValueProp from "../components/landing/sections/ValueProp";
import Credentials from "../components/landing/sections/Credentials";
import CTA from "../components/landing/sections/CTA";

export default function Landing() {
	return (
		<div className="landing bg-gradient-to-r from-green-800 to-green-600">
			<Hook />
			<ValueProp />
			<Credentials />
			<CTA />
		</div>
	);
}
