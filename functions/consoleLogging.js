'use strict';
import 'dotenv/config';
import Beaver from 'beaver-logs';

// Initialize Beaver logging if enabled, otherwise use console
// Beaver is a wrapper around console
export const beaver = process.env.USE_BEAVER == 'true' ? new Beaver(process.env.BEAVER_TOKEN) : console;
