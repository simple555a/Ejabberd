%%%----------------------------------------------------------------------
%%%
%%% ejabberd, Copyright (C) 2002-2016   ProcessOne
%%%
%%% This program is free software; you can redistribute it and/or
%%% modify it under the terms of the GNU General Public License as
%%% published by the Free Software Foundation; either version 2 of the
%%% License, or (at your option) any later version.
%%%
%%% This program is distributed in the hope that it will be useful,
%%% but WITHOUT ANY WARRANTY; without even the implied warranty of
%%% MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
%%% General Public License for more details.
%%%
%%% You should have received a copy of the GNU General Public License along
%%% with this program; if not, write to the Free Software Foundation, Inc.,
%%% 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
%%%
%%%----------------------------------------------------------------------
-define(PRINT(Format, Args), io:format(Format, Args)).
-compile([{parse_transform, lager_transform}]).

%% 打印debug信息的宏定义
-define(DEBUG(Format, Args),
	lager:debug(Format, Args)).

%% 打印info信息的宏定义
-define(INFO_MSG(Format, Args),
	lager:info(Format, Args)).

%% 打印warning信息的宏定义
-define(WARNING_MSG(Format, Args),
	lager:warning(Format, Args)).

%% 打印error信息的宏定义
-define(ERROR_MSG(Format, Args),
	lager:error(Format, Args)).

%% 打印critical信息的宏定义
-define(CRITICAL_MSG(Format, Args),
	lager:critical(Format, Args)).
