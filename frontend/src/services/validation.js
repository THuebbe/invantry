// src/services/validation.js

export function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function validatePhone(phone) {
	// Remove all non-digits
	const cleaned = phone.replace(/\D/g, "");
	return cleaned.length >= 10;
}

export function validateContactForm(data) {
	const errors = {};

	if (!data.firstName || data.firstName.trim().length === 0) {
		errors.firstName = "First name is required";
	}

	if (!data.email || !validateEmail(data.email)) {
		errors.email = "Valid email is required";
	}

	if (data.phone && !validatePhone(data.phone)) {
		errors.phone = "Please enter a valid phone number";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}
