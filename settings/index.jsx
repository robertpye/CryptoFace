function mySettings(props) {
  return (
    <Page>
      <Section 
        title="Crypto/Stock watchface settings"
        description="These are the tickers to retrieve and show on your watchface. Crypto usually requires a suffix such as '-USD'. Note: Changes may take up to 5 minutes to take effect">
        
        <TextInput
          settingsKey="setting-ticker1"
          label="Ticker #1"
          placeholder="BTC-USD" />
        <TextInput
          settingsKey="setting-ticker2"
          label="Ticker #2"
          placeholder="ETH-USD" />
        <TextInput
          settingsKey="setting-ticker3"
          label="Ticker #3"
          placeholder="LTC-USD" />
        <TextInput
          settingsKey="setting-ticker4"
          label="Ticker #4"
          placeholder="XRP-USD" />
        <TextInput
          settingsKey="setting-ticker5"
          label="Ticker #5"
          placeholder="DIA" />
        <TextInput
          settingsKey="setting-ticker6"
          label="Ticker #6"
          placeholder="VTSAX" />
      </Section>
    </Page>
  )
}

registerSettingsPage(mySettings)