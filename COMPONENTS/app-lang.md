# Application languages

PoC user interface components SHALL not hard-code any textual content. Instead, an internationalisation module must be used, providing the user the ability to select and change the display language. According to [Regulation 1 on the EEC](http://data.europa.eu/eli/reg/1958/1(1)/2013-07-01), the following languages must be supported:

- Bulgarian, `bg`;
- Croatian, `hr`;
- Czech, `cs`
- Danish, `da`
- Dutch, `nl`
- English, `en`
- Estonian, `et`
- Finnish, `fi`
- French, `fr`
- German, `de`
- Greek, `el`
- Hungarian, `hu` 
- Irish, `ga`
- Italian, `it`
- Latvian, `lv`
- Lithuanian, `lt`
- Maltese, `mt`
- Polish, `pl`
- Portuguese, `pt`
- Romanian, `ro`
- Slovak, `sk`
- Slovenian, `sl`
- Spanish, `es` and
- Swedish `sv`.

All texts will originally be provided in EN, whereby the application users should be able to propose a translation in their language, which can then be added to the language configuration files of the application. These translation proposals should be structured but not necessarily linked data.

## Text literals

All text literals must be stored with the language tag correctly set. If a user selects another language than 'en', the tag must be stored with the string literal.

Given historical data, other language tags from the ISO MAY be possible in some data. They will need to be manually deduced by inspecting the country of origin of the resource, if that can be deduced.
