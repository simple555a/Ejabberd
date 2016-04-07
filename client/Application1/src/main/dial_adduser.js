﻿function dial_adduser ()
{
	if ( external.windows.Exists( 'adduser' ) )
	{
		if ( external.windows( 'adduser' ).isMinimized )
			external.windows( 'adduser' ).restore();
		external.windows( 'adduser' ).focus();
	}
	else
		with ( external.createWindow( 'adduser', external.globals( 'cwd' ) + 'adduser.html', window ) )
		{
			setTitle( external.globals( 'Translator' ).Translate( 'main', 'wnd_adduser' ) );
			setIcon( external.globals( 'cwd' ) + '..\\images\\contact-add\\contact-add.ico' );
			resizeable( false );
			showMinBox( true );
			setSize( 500, 450 );
			setPos( ( screen.availWidth - 500 ) / 2, ( screen.availHeight - 450 ) / 2 );
		}
}
