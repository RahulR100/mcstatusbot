'use strict';
import 'dotenv/config';
import unidecode from 'unidecode';
import validator from 'validator';
import bogon from 'bogon';
const { isIP, isFQDN, isEmpty, isPort } = validator;

// Validate a host
// A host may contain and FQDN or an IP address, with an optional port
export function validateHost(host) {
	// Get the IP and port (if it exists)
	let [ip, port] = host.split(':');

	// If there is a port, validate both the IP and the port
	if (host.includes(':')) {
		// First validate the IP address
		const ipCheck = validateAddress(ip);

		// If the IP address is valid, check the port
		if (ipCheck.valid) {
			// Port must not be empty and must be a valid port number (0-65535)
			if (!isEmpty(port) && isPort(port)) {
				return { valid: true };
			}

			return { valid: false, reason: 'port' };
		}

		// If the IP address is invalid, return the error that the IP address validator returned
		return ipCheck;
	}

	// If there is no port, just validate the IP address
	return validateAddress(ip);
}

// Validate an IP address or FQDN
function validateAddress(ip) {
	// Decode any unicode characters to prevent spoofing
	const decoded = unidecode(ip);

	// Check if it's an IP address
	if (isIP(decoded)) {
		// Check if it's a bogon IP
		// A bogon is an IP address that should not be routable on the public internet
		// This includes private IPs and loopback addresses as per RFC1918
		// WARNING! If you are hosting on a commercial hosting provider, DO NOT REMOVE THIS CHECK! You may get banned!
		if (process.env.ALLOW_PRIVATE_IPS != "true" && bogon(decoded)) {
			return { valid: false, reason: 'bogon' };
		}
		return { valid: true };
	}

	// If it's not an IP address, check if it's a valid FQDN
	// FQDNs cannot contain underscores - this is temporary untin the new ping server is deployed
	// RFC2181 allows underscores in hostnames
	// TODO: Remove this check when the new ping server is deployed
	if (!isFQDN(decoded)) {
		return { valid: false, reason: decoded.includes('_') ? 'underscore' : 'invalid' };
	}

	return { valid: true };
}
