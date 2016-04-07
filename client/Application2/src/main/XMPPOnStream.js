function XMPPOnStream ( ReceivedXML )
{
	warn( 'RECV: ' + ReceivedXML.xml );

	/* Server supports stream encryption
	 */
	if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/starttls[@xmlns="urn:ietf:params:xml:ns:xmpp-tls"]' ) 
		&& ( external.globals( 'encryption' ) == 'optional' || external.globals( 'encryption' ) == 'tls' ) )
	{
		var Str = '<starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls"/>';
		warn( 'SENT: ' + Str );
		external.XMPP.SendText( Str );
	}

	/* Server is ready to start stream encryption handshake
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/proceed[@xmlns="urn:ietf:params:xml:ns:xmpp-tls"]' ) )
	{
		external.XMPP.StartTLS();
	}

	/* Error during encryption
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/failure[@xmlns="urn:ietf:params:xml:ns:xmpp-tls"]' ) )
	{
		OnLoginAbort();
	}

	/* Authentication
	 */
	else if ( ( external.globals( 'encryption' ) != 'tls' || external.globals( 'XMPPEncryption' ) == 'tls' )
		&& ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]' )
			|| ReceivedXML.documentElement.selectSingleNode( '/stream:features/auth[@xmlns="http://jabber.org/features/iq-auth"]' )
			|| ( ReceivedXML.documentElement.selectSingleNode( '/stream:features' )
				&& ! ReceivedXML.documentElement.childNodes.length
			)
		)
	)
	{
		/* Request challenge if the server supports GSSAPI, GSS-SPNEGO, or NTLM mechanism
		 */
		if ( external.globals( 'sspiserver' ).length || external.globals( 'authentication' ) == 'ntlm' )
		{
			if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "GSS-SPNEGO" ]' ) )
			{
				external.globals( 'XMPPSASLMechanism' ) = 'GSS-SPNEGO';
				var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
				dom.loadXML( '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="GSS-SPNEGO"/>' );
				external.SASL.SSPI.Reset();
				warn( 'SENT: ' + dom.xml );
				external.XMPP.SendXML( dom );
			}
			else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "NTLM" ]' ) )
			{
				external.globals( 'XMPPSASLMechanism' ) = 'NTLM';
				var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
				dom.loadXML( '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="NTLM"/>' );
				external.SASL.SSPI.Reset();
				warn( 'SENT: ' + dom.xml );
				external.XMPP.SendXML( dom );
			}
			else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "GSSAPI" ]' ) )
			{
				external.globals( 'XMPPSASLMechanism' ) = 'GSSAPI';
				var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
				dom.loadXML( '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="GSSAPI"/>' );
				try {
					external.SASL.GSSAPI.Reset();
					dom.documentElement.text = external.SASL.GSSAPI.GenerateResponse( external.XMPP.ConnectionFQDN, '' );
				}
				catch(e) {
					warn( 'GSSAPI: ERROR: ' + e.number + "\n" + external.SASL.GSSAPI.GetLastErrorMessage() );
				}
				warn( 'SENT: ' + dom.xml );
				external.XMPP.SendXML( dom );
			}
			else 
			{
				var Str = '<abort xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>';
				warn( 'SENT: ' + Str );
				external.XMPP.SendText( Str );
				OnLoginAbort();
			}
		}

		/* Request SCRAM-SHA-1 challenge
		 */
		else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "SCRAM-SHA-1" ]' ) )
		{
			external.globals( 'XMPPSASLMechanism' ) = 'SCRAM-SHA-1';
			var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
			dom.loadXML( '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="SCRAM-SHA-1"/>' );
			try
			{
				external.SASL.SCRAM.Initialize(external.globals( 'cfg' )( 'username' ), external.globals( 'cfg' )( 'password' ));
				dom.documentElement.text = external.SASL.SCRAM.GenerateClientFirstMessage();
			}
			catch(e)
			{
				warn( 'SCRAM-SHA-1: ERROR: Unacceptable username or password.' );
			}
			warn( 'SENT: ' + dom.xml );
			external.XMPP.SendXML( dom );
			external.globals( 'XMPPChallengesReceived' ) = 0;
		}

		/* Request MD5 challenge
		 */
		else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "DIGEST-MD5" ]' ) )
		{
			external.globals( 'XMPPSASLMechanism' ) = 'DIGEST-MD5';
			var Str = '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="DIGEST-MD5"/>';
			warn( 'SENT: ' + Str );
			external.XMPP.SendText( Str );
		}

		/* Send plaintext credentials
		 */
		else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "PLAIN" ]' ) )
		{
			external.globals( 'XMPPSASLMechanism' ) = 'PLAIN';
			var User = external.globals( 'cfg' )( 'username' );
			var Addr = ""; // User + '@' + external.globals( 'cfg' )( 'server' ); /* Only to be used if authzid is different from authcid */
			var Pass = external.globals( 'cfg' )( 'password' );

			/* Plaintext algorithm:
			 * Base64( UTF8( Addr ) + 0x00 + UTF8( User ) + 0x00 + UTF8( Pass ) )
			 */
			var Data = external.SASL.PlainGenerateResponse( Addr, User, Pass );

			var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
			dom.loadXML( '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN"/>' );
			dom.documentElement.text = Data;
			warn( 'SENT: ' + dom.xml );
			external.XMPP.SendXML( dom );
		}

		/* Use old protocol to log in
		 */
		else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/auth[@xmlns="http://jabber.org/features/iq-auth"]' )
			|| ( ReceivedXML.documentElement.selectSingleNode( '/stream:features' )
				&& ( ! ReceivedXML.documentElement.childNodes.length /* Desperate attempt if no mechanisms are reported */
					|| ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]/mechanism[ . = "GSSAPI" ]' ) /* iChat Server bug workaround */
				)
			)
		)
		{
			var hook		= new XMPPHookIQ();
			hook.Window		= external.wnd;
			hook.Callback	= 'OnLoginAuthSend';

			var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
			dom.loadXML( '<iq type="get"><query xmlns="jabber:iq:auth"><username/></query></iq>' );
			dom.documentElement.firstChild.firstChild.text = external.globals( 'cfg' )( 'username' );
			dom.documentElement.setAttribute( 'to', external.globals( 'cfg' )( 'server' ) );
			dom.documentElement.setAttribute( 'id', hook.Id );
			warn( 'SENT: ' + dom.xml );
			external.XMPP.SendXML( dom );
		}

		/* Unsupported authentication mechanisms
		 */
		else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/mechanisms[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]' ) )
		{
			var Str = '<abort xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>';
			warn( 'SENT: ' + Str );
			external.XMPP.SendText( Str );
			OnLoginAuthError();
		}

		/* Unsupported stream features
		 */
		else
		{
			OnLoginAbort();
		}
	}

	/* Decode authentication challenge and answer with correct credentials
	 */
	else if (ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']")) {
		if (external.globals("sspiserver").length || external.globals("authentication") == "ntlm") {
			var dom = new ActiveXObject("Msxml2.DOMDocument");
			dom.loadXML("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>");
			if (external.globals( 'XMPPSASLMechanism' ) == 'GSSAPI') {
				try {
					dom.documentElement.text = external.SASL.GSSAPI.GenerateResponse( external.XMPP.ConnectionFQDN, ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text );
				} catch(e) {
					warn( 'GSSAPI: ERROR: ' + e.number + ' ' + external.SASL.GSSAPI.GetLastErrorMessage() );
				}
			} else {
				dom.documentElement.text = external.SASL.SSPI.GenerateResponse(ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text, true);
			}
			warn("SENT: " + dom.xml);
			external.XMPP.SendXML(dom);
		} else if( external.globals( 'XMPPSASLMechanism' ) == 'SCRAM-SHA-1' && external.globals( 'XMPPChallengesReceived' ) == 0 ) {
			var dom = new ActiveXObject("Msxml2.DOMDocument");
			dom.loadXML("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>" );
			try {
				external.SASL.SCRAM.ValidateServerFirstMessage( ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text );
				dom.documentElement.text = external.SASL.SCRAM.GenerateClientFinalMessage();
			} catch(e) {
				warn( 'SCRAM-SHA-1: ERROR: Server replied with invalid nonce.' );
			}
			warn("SENT: " + dom.xml);
			external.XMPP.SendXML(dom);
			external.globals( 'XMPPChallengesReceived' ) = 1;
		} else if( external.globals( 'XMPPSASLMechanism' ) == 'SCRAM-SHA-1' && external.globals( 'XMPPChallengesReceived' ) == 1 ) {
			var dom = new ActiveXObject("Msxml2.DOMDocument");
			dom.loadXML("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>" );
			try {
				external.SASL.SCRAM.ValidateServerFinalMessage( ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text );
			} catch(e) {
				warn( 'SCRAM-SHA-1: ERROR: Server authentication failed.' );
			}
			warn("SENT: " + dom.xml);
			external.XMPP.SendXML(dom);
			external.globals( 'XMPPChallengesReceived' ) = 2;
		} else {
			var encoded = ReceivedXML.documentElement.selectSingleNode("/challenge[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text;
			var decoded = external.Base64ToString(encoded);
			warn("SASL: " + decoded);
			var saslPattern = '\\s*([a-z\\-]+)\\s*(?:\\=\\s*(?:(?:\\"([^\\"]+)\\")|(?:([^\\"\\,\\s]+)))\\s*)?\\,?';
			var saslPairs = decoded.match(new RegExp(saslPattern, "g"));
			var dataset = {};
			if (saslPairs !== null)
				for (var i = 0; i < saslPairs.length; i++) {
					var pair = saslPairs[i].match(new RegExp(saslPattern));
					if (pair !== null)
						dataset[pair[1]] = pair[2].length ? pair[2] : pair[3];
				}

			/* Successful authentication
			 */
			if ("rspauth" in dataset) {
				var Str = "<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>";
				warn("SENT: " + Str);
				external.XMPP.SendText(Str);

			/* Solve the MD5 challenge
			 */
			} else if (dataset["algorithm"] == "md5-sess" && "nonce" in dataset && "qop" in dataset) {
				var response = {
//					"authzid": external.globals("cfg")("username") + "@" + external.globals("cfg")("server"),
					"charset": "utf-8",
					"cnonce": external.StringToSHA1(Math.random().toString()),
					"digest-uri": "xmpp/" + external.globals("cfg")("server"),
					"host": external.globals("cfg")("server"),
					"nonce": dataset["nonce"],
					"nc": "00000001",
					"password": external.globals("cfg")("password"),
					"qop": "auth",
					"realm": "realm" in dataset ? dataset["realm"] : "",
					"serv-type": "xmpp",
					"username": external.globals("cfg")("username")
				};

				response["response"] = external.SASL.DigestGenerateResponse(
					response["username"],
					response["realm"],
					response["password"],
					response["nonce"],
					response["cnonce"],
					response["digest-uri"],
					response["nc"],
					response["qop"]
				);

				var output = "username=\"" + response["username"] + "\"," +
					"realm=\"" + response["realm"] + "\"," +
					"nonce=\"" + response["nonce"] + "\"," +
					"cnonce=\"" + response["cnonce"] + "\"," +
					"nc=" + response["nc"] + ","  +
					"qop=" + response["qop"] + ","  +
					"digest-uri=\"" + response["digest-uri"] + "\"," +
					"charset=" + response["charset"] + ","  +
//					"authzid=\"" + response["authzid"] + "\"," +
					"response=" + response["response"];

				var dom = new ActiveXObject("Msxml2.DOMDocument");
				dom.loadXML("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>" );
				dom.documentElement.text = external.StringToBase64(output);
				warn("SENT: " + dom.xml);
				external.XMPP.SendXML(dom);
				warn("SASL: " + output);

			/* Return an error message and abort the connection
			 */
			} else {
				var Str = "<abort xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>";
				warn("SENT: " + Str);
				external.XMPP.SendText(Str);
				OnLoginAuthError();
			}
		}
	}

	/* Re-initialise the stream
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/success[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]' ) )
	{
		if( external.globals( 'XMPPSASLMechanism' ) == 'SCRAM-SHA-1' && external.globals( 'XMPPChallengesReceived' ) == 1 )
		{
			try {
				external.SASL.SCRAM.ValidateServerFinalMessage( ReceivedXML.documentElement.selectSingleNode("/success[@xmlns='urn:ietf:params:xml:ns:xmpp-sasl']").text );
				XMPPOnConnected();
			} catch(e) {
				warn( 'SCRAM-SHA-1: ERROR: Server authentication failed.' );
			}
		} else {
			XMPPOnConnected();
		}
	}

	/* Error during authentication
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/failure[@xmlns="urn:ietf:params:xml:ns:xmpp-sasl"]' ) )
	{
		OnLoginAuthError();
	}

	/* Server supports stream compression
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/compression[@xmlns="http://jabber.org/features/compress"]/method[ . = "zlib" ]' ) )
	{
		var Str = '<compress xmlns="http://jabber.org/protocol/compress"><method>zlib</method></compress>';
		warn( 'SENT: ' + Str );
		external.XMPP.SendText( Str );
	}

	/* Server is ready to start stream compression
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/compressed[@xmlns="http://jabber.org/protocol/compress"]' ) )
	{
		external.XMPP.StartSC();
		//XMPPOnConnected();
	}

	/* Error during compression
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/failure[@xmlns="http://jabber.org/protocol/compress"]' ) )
	{
		OnLoginAbort();
	}

	/* Bind a resource to the stream
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:features/bind[@xmlns="urn:ietf:params:xml:ns:xmpp-bind"]' ) )
	{
		var hook		= new XMPPHookIQ();
		hook.Window		= external.wnd;
		hook.Callback	= 'OnLoginBind';

		var dom = new ActiveXObject( 'Msxml2.DOMDocument' );
		dom.loadXML( '<iq type="set"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><resource/></bind></iq>' );
		dom.documentElement.setAttribute( 'id', hook.Id );
		dom.documentElement.firstChild.firstChild.text = external.globals( 'cfg' )( 'resource' );
		warn( 'SENT: ' + dom.xml );
		external.XMPP.SendXML( dom );
	}

	/* Generate a different resource and auto-reconnect
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:conflict[@xmlns="urn:ietf:params:xml:ns:xmpp-streams"]' ) )
	{
		external.globals( 'cfg' )( 'resource' ) = external.globals( 'cfg' )( 'resource' ) + ' (' + Math.round( Math.random() * 0xffff ) + ')';
		var Str = '</stream:stream>';
		warn( 'SENT: ' + Str );
		external.XMPP.SendText( Str );
		external.XMPP.Disconnect();
	}

	/* Something has gone wrong, do not attempt to reconnect automatically
	 */
	else if ( ReceivedXML.documentElement.selectSingleNode( '/stream:error' ) )
	{
		if ( external.windows.Exists( 'signup' ) )
			OnLoginAbort();
		else
		{
			var temporaryStreamErrors = [
				'bad-format',
				'connection-timeout',
				'internal-server-error',
				'invalid-from',
				'invalid-xml',
				'policy-violation',
				'resource-constraint',
				'restricted-xml',
				'system-shutdown',
				'unsupported-stanza-type',
				'xml-not-well-formed'
			];
			external.globals( 'XMPPReconnect' ) = false;
			for ( var i in temporaryStreamErrors )
				if ( ReceivedXML.documentElement.selectSingleNode( '/stream:error/' + temporaryStreamErrors[i] ) !== null )
				{
					external.globals( 'XMPPReconnect' ) = true;
					break;
				}
			var Str = '</stream:stream>';
			warn( 'SENT: ' + Str );
			external.XMPP.SendText( Str );
			external.XMPP.Disconnect();
		}
	}
}
