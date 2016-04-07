function dial_console ()
{
	if ( external.windows.Exists( 'stderr' ) )
	{
		if ( external.windows( 'stderr' ).isMinimized )
			external.windows( 'stderr' ).restore();
		external.windows( 'stderr' ).focus();
	}
	else
		with ( external.createWindow( 'stderr', external.globals( 'cwd' ) + 'console.html', window ) )
		{
			setTitle( external.globals( 'Translator' ).Translate( 'main', 'wnd_console' ) );
			setSize( 800, 500 );
			MinHeight = 210;
			MinWidth = 400;
			setPos( ( screen.availWidth - 800 ) / 2, ( screen.availHeight - 500 ) / 2 );
			setIcon( external.globals( 'cwd' ) + '..\\images\\console\\monitor.ico' );
			hide( false );
			focus();
		}
}
