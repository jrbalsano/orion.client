/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global describe it module require*/

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var assert = require("assert"),
	eslint = require("../../../lib/eslint");

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

var RULE_ID = "new-parens";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
describe(RULE_ID, function() {
	it("should flag new", function() {
		var topic = "new Object";

		var config = { rules: {} };
		config.rules[RULE_ID] = 1;

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].ruleId, RULE_ID);
		assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
		assert.equal(messages[0].node.type, "Identifier");
	});
	it("should flag new with non-parenthesis token next", function() {
		var topic = "new Object;";

		var config = { rules: {} };
		config.rules[RULE_ID] = 1;

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].ruleId, RULE_ID);
		assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
		assert.equal(messages[0].node.type, "Identifier");
	});
	it("should not flag new", function() {
		var topic = "new Object();";

		var config = { rules: {} };
		config.rules[RULE_ID] = 1;

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("should not flag new with extra space", function() {
		//TODO this is a bug in eslint, once we update to a newer version this has been fixed
		var topic = "new Object    ();";

		var config = { rules: {} };
		config.rules[RULE_ID] = 1;

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 1);
		assert.equal(messages[0].ruleId, RULE_ID);
		assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
		assert.equal(messages[0].node.type, "Identifier");
	});
});
