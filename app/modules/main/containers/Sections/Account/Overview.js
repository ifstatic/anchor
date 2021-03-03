// @flow
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import compose from 'lodash/fp/compose';
import { withRouter } from 'react-router-dom';
import { Button, Container, Header, Icon, Segment } from 'semantic-ui-react';
import { Asset } from '@greymass/eosio';
import { Resources } from '@greymass/eosio-resources';
import AccountHeader from './Header';
import AccountOverviewRam from './Overview/Ram';
import AccountOverviewResource from './Overview/Resource';

import * as AccountsActions from '../../../../../shared/actions/accounts';
import * as NavigationActions from '../../../actions/navigation';

class AccountOverview extends Component<Props> {
  constructor(props) {
    super(props);
    const account = props.match.params.account_name;
    const loaded = (
      Object.keys(this.props.accounts).includes(account)
      && Object.keys(this.props.balances).includes(account)
    );
    this.state = {
      account,
      expanded: {},
      features: [],
      loaded,
      rex: false,
      rstate: false,
      powerup: false,
      pstate: false,
    };
  }
  componentDidMount() {
    const { settings } = this.props;
    const { account } = settings;
    if (
      // Missing account
      !Object.keys(this.props.accounts).includes(account)
      // Missing balance
      || !Object.keys(this.props.balances).includes(account)
    ) {
      this.props.actions.getAccount(account);
    }
    this.initProviders();
  }
  componentDidUpdate(prevProps) {
    const { connection, settings } = this.props;
    // If the user changes the current account, change the UI
    if (connection.httpEndpoint !== prevProps.connection.httpEndpoint) {
      this.initProviders();
    }
    if (
      settings.account !== prevProps.settings.account
      || settings.chainId !== prevProps.settings.chainId
    ) {
      this.setState({
        account: settings.account,
        loaded: false,
      }, () => this.props.actions.changeModule(`account/${settings.account}`));
    }
    // Let the UI know when the account is loaded
    const { loaded } = this.state;
    if (!loaded) {
      const { accounts, balances } = this.props;
      if (
        Object.keys(accounts).includes(settings.account)
        && Object.keys(balances).includes(settings.account)
      ) {
        this.setState({ loaded: true });
      }
    }
  }
  initProviders = async () => {
    const { connection } = this.props;
    const features = [];
    if (connection.supportedContracts.includes('rex')) {
      features.push('rex');
    }
    if (connection.supportedContracts.includes('powerup')) {
      features.push('powerup');
    }
    this.resources = new Resources({ url: connection.httpEndpoint });
    this.setState({
      features,
      rex: false,
      powerup: false,
      pstate: false,
    }, async () => {
      const ms = 1;
      const symbol = `${connection.tokenPrecision},${connection.chainSymbol}`;
      if (features.includes('rex')) {
        const rstate = await this.resources.v1.rex.get_state();
        const sample = await this.resources.getSampledUsage();
        const rex = Asset.from(rstate.price_per_ms(sample, ms), symbol);
        this.setState({ rex, rstate });
      }
      if (features.includes('powerup')) {
        const pstate = await this.resources.v1.powerup.get_state();
        const powerup = Asset.from(pstate.cpu.price_per_ms(ms), symbol);
        this.setState({ powerup, pstate });
      }
    });
  }
  toggleExpand = (e, { name }) => {
    this.setState({
      expanded: Object.assign({}, this.state.expanded, {
        [name]: !this.state.expanded[name]
      })
    });
  }
  refresh = () => {
    const { getAccount } = this.props.actions;
    getAccount(this.state.account);
  }
  render() {
    const {
      t
    } = this.props;
    const {
      account,
      features,
      loaded,
      rex,
      powerup,
      pstate,
    } = this.state;
    if (!account || account === 'undefined') {
      return (
        <Segment>
          <Header>
            {t('main_sections_overview_header_two')}
            <Header.Subheader>
              {t('main_sections_overview_subheader_two')}
            </Header.Subheader>
          </Header>
        </Segment>
      );
    }
    return (
      <React.Fragment>
        <Container fluid clearing>
          <Button
            basic
            color="grey"
            content={t('main_sections_overview_button_one')}
            floated="right"
            icon="refresh"
            onClick={this.refresh}
          />
          <Header
            content={t('main_sections_overview_header_one')}
            subheader={t('main_sections_overview_subheader_one')}
            style={{ margin: 0 }}
          />
        </Container>
        {(loaded)
          ? (
            <React.Fragment>
              <AccountHeader
                account={account}
              />
              <AccountOverviewRam
                account={account}
              />
              <AccountOverviewResource
                account={account}
                powerup={powerup}
                pstate={pstate}
                resource="cpu"
                rex={rex}
              />
              <AccountOverviewResource
                account={account}
                powerup={powerup}
                pstate={pstate}
                resource="net"
                rex={rex}
              />
            </React.Fragment>
          )
          : false
        }
        {(!loaded)
          ? (
            <Segment>
              <Header icon size="large" textAlign="center">
                <Icon
                  loading
                  name="circle notched"
                />
                {t('main_sections_overview_header_two')}
                <Header.Subheader
                  content={t('main_sections_overview_subheader_two')}
                />
              </Header>
            </Segment>
          )
          : false
        }
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    accounts: state.accounts,
    balances: state.balances,
    connection: state.connection,
    resources: state.resources,
    settings: state.settings,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      ...NavigationActions,
      ...AccountsActions,
    }, dispatch)
  };
}

export default compose(
  withRouter,
  withTranslation('main'),
  connect(mapStateToProps, mapDispatchToProps)
)(AccountOverview);
