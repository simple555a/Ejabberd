function dial_bookmarks_manage ()
{
	if ( external.windows.Exists( 'bookmarks_manage' ) )
	{
		if ( external.windows( 'bookmarks_manage' ).isMinimized )
			external.windows( 'bookmarks_manage' ).restore();
		external.windows( 'bookmarks_manage' ).focus();
	}
	else
		with ( external.createWindow( 'bookmarks_manage', external.globals( 'cwd' ) + 'bookmarks_manage.html', new Array( window ) ) )
		{
			setTitle( external.globals( 'Translator' ).Translate( 'main', 'wnd_bookmarks_manage' ) );
			setIcon( external.globals( 'cwd' ) + '..\\images\\conference\\contacts.ico' );
			resizeable( false );
			MinHeight = MinWidth = 0;
			setSize( 450, 300 );
			setPos( ( screen.availWidth - 450 ) / 2, ( screen.availHeight - 300 ) / 2 );
		}
}
