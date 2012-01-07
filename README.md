Airhockey is a simulation of an airhockey club, the core of which is a
airhockey table and match.  The whole is surrounded by a ladder system
allowing players to meet other players and initiate matches.

A video which explains all this is available on YouTube at
http://youtu.be/U2wpxycGq38

The software is currently configured to use mootools 1.3. It is also
configured to use a templating system so that it can sit within an
existing site and look like it. Details can be seen by examining the
code.

It also uses the SMF forum to find out details of the player, but it
should be trivial to use other similar login systems to identify the
players.

I am particularly proud of the high speed system for keeping the
players up to date.  It seems to work quite well on most linux hosting
systems (using apache) but rely on named pipes for communication
between the players.
