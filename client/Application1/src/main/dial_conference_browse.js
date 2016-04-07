﻿function dial_conference_browse ()
{
	if ( external.windows.Exists( 'conference_browse' ) )
	{
		if ( external.windows( 'conference_browse' ).isMinimized )
			external.windows( 'conference_browse' ).restore();
		external.windows( 'conference_browse' ).focus();
	}
	else
		with ( external.createWindow( 'conference_browse', external.globals( 'cwd' ) + 'conference_browse.html', window ) )
		{
			setTitle( external.globals( 'Translator' ).Translate( 'main', 'wnd_room_browse' ) );
			setIcon( external.globals( 'cwd' ) + '..\\images\\conference\\contacts.ico' );
			resizeable( false );
			showMinBox( true );
			setSize( 550, 450 );
			setPos( ( screen.availWidth - 550 ) / 2, ( screen.availHeight - 450 ) / 2 );
		}
}
