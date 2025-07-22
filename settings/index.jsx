function mySettings(props) {
    return (
        <Page>
            <Section
                title="Customize Tickers/Symbols"
                description="These are the tickers to retrieve and show on your watchface. Crypto usually requires a suffix such as '-USD'">

                <TextInput
                    settingsKey="setting-ticker1"
                    label="Set Ticker #1"
                    placeholder="BTC-USD"/>
                <TextInput
                    settingsKey="setting-ticker2"
                    label="Set Ticker #2"
                    placeholder="ETH-USD"/>
                <TextInput
                    settingsKey="setting-ticker3"
                    label="Set Ticker #3"
                    placeholder="THB=x"/>
                <TextInput
                    settingsKey="setting-ticker4"
                    label="Set Ticker #4"
                    placeholder="NFLX"/>
                <TextInput
                    settingsKey="setting-ticker5"
                    label="Set Ticker #5"
                    placeholder="DIA"/>
                <TextInput
                    settingsKey="setting-ticker6"
                    label="Set Ticker #6"
                    placeholder="VOO"/>
            </Section>
            <Section
                title="Customize Labels (Optional)"
                description="Customize the display name for each of your tracked tickers/symbols. Leave empty to default to the original ticker/symbol.">

                <TextInput
                    settingsKey="setting-tickerlabel1"
                    label="Set Label #1"
                    placeholder="Default"/>
                <TextInput
                    settingsKey="setting-tickerlabel2"
                    label="Set Label #2"
                    placeholder="Default"/>
                <TextInput
                    settingsKey="setting-tickerlabel3"
                    label="Set Label #3"
                    placeholder="Default"/>
                <TextInput
                    settingsKey="setting-tickerlabel4"
                    label="Set Label #4"
                    placeholder="Default"/>
                <TextInput
                    settingsKey="setting-tickerlabel5"
                    label="Set Label #5"
                    placeholder="Default"/>
                <TextInput
                    settingsKey="setting-tickerlabel6"
                    label="Set Label #6"
                    placeholder="Default"/>
            </Section>
            <Section
                title="Refresh Button or Fear/Greed Indices"
                description="This swaps between showing the Fear/Greed Indices and the refresh button.">

                <Toggle
                    settingsKey="setting-show-refresh"
                    label="Show Refresh Button"
                />
            </Section>
        </Page>
    )
}

registerSettingsPage(mySettings)
