import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, Modal, StyleSheet, Button, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
      dishes: state.dishes,
      comments: state.comments,
      favorites: state.favorites
    }
  }

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
})

const shareDish = (title, message, url) => {
    Share.share({
        title: title,
        message: title + ': ' + message + ' ' + url,
        url: url
    },{
        dialogTitle: 'Share ' + title
    })
}

const RenderDish = (props) => {

    const dish = props.dish;

    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if ( dx < -200 )
            return true;
        else
            return false;
    }

    const recognizeComment = ({ moveX, moveY, dx, dy }) => {
        if ( dx > 200 )
            return true;
        else
            return false;
    }

    handleViewRef = ref => this.view = ref;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: () => {
            this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
        },
        onPanResponderEnd: (e, gestureState) => {
            if (recognizeDrag(gestureState)) {
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + dish.name + ' to favorite?',
                    [
                    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    {text: 'OK', onPress: () => {props.favorite ? console.log('Already favorite') : props.onPress()}},
                    ],
                    { cancelable: false }
                );
            return true
            } else if (recognizeComment(gestureState)) {
                props.gestureRecognized()
                return true
            }
        }
    })

        if (dish != null) {
            return(
                <Animatable.View 
                animation="fadeInDown" 
                duration={2000} 
                delay={1000}
                ref={this.handleViewRef}
                {...panResponder.panHandlers}>
                    <Card
                    featuredTitle={dish.name}
                    image={{uri: baseUrl + dish.image}}>
                        <Text style={{margin: 10}}>
                            {dish.description}
                        </Text>
                        <View style={{justifyContent: 'center', padding: 5, flexDirection: 'row'}}>
                            <Icon
                                raised
                                reverse
                                name={ props.favorite ? 'heart' : 'heart-o'}
                                type='font-awesome'
                                color='#f50'
                                onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                            />
                            <Icon
                                raised
                                reverse
                                name='pencil'
                                type='font-awesome'
                                color='#512DA8'
                                onPress={() => props.onPressForm()}
                            />
                            <Icon
                                raised
                                reverse
                                name='share'
                                type='font-awesome'
                                color='#51D2A8'
                                onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} 
                            />
                        </View>
                    </Card>
                </Animatable.View>
            );
        }
        else {
            return(<View></View>);
        }
}

function RenderComments(props) {

    const comments = props.comments;
            
    const renderCommentItem = ({item, index}) => {
        
        return (
            <View key={index} style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.comment}</Text>
                <Text style={{fontSize: 12}}>{item.rating} Stars</Text>
                <Text style={{fontSize: 12}}>{'-- ' + item.author + ', ' + item.date} </Text>
            </View>
        );
    };
    
    return (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>        
            <Card title='Comments' >
                <FlatList 
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()}
                    />
            </Card>
        </Animatable.View>
    );
}

class DishDetail extends Component {

    constructor(props){
        super(props)
        this.state={
            author: '',
            comment: '',
            rating: 4,
            showModal: false
        }
    }

    static navigationOptions = {
        title: 'Dish Details'
    };

    toggleModal() {
        this.setState({showModal: !this.state.showModal});
        console.log('state', this.state)
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    resetForm() {
        this.setState({
            author: '',
            comment: '',
            rating: 4,
            showModal: false
        });
    }

    handleComment() {
        const dishId = this.props.navigation.getParam('dishId','');
        this.props.postComment(dishId, this.state.rating, this.state.author, this.state.comment)
    }
 
    render() {
        const dishId = this.props.navigation.getParam('dishId','');
        return(
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)} 
                    onPressForm={() => this.toggleModal()}
                    gestureRecognized={() => this.toggleModal()}
                    >
                </RenderDish>
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
                <Modal animationType = {"slide"} transparent = {false}
                    visible = {this.state.showModal}
                    onDismiss = { () => this.toggleModal() }
                    onRequestClose = { () => this.toggleModal() }>
                    <View style = {{justifyContent: 'center', margin: 20, padding: 5}}>
                        <Rating
                        showRating
                        fractions={0}
                        startingValue={4}
                        onFinishRating={value => this.setState({ rating: value })}    
                            />
                        <Input
                            placeholder='Author'
                            leftIcon={{ type: 'font-awesome', name: 'user-circle-o' }}
                            onChangeText={value => this.setState({ author: value })}
                            />
                        <Input
                            placeholder='Comment'
                            leftIcon={{ type: 'font-awesome', name: 'comment' }}
                            onChangeText={value => this.setState({ comment: value })}
                            />
                        <Button 
                            onPress = {() =>{this.handleComment(); this.toggleModal(); this.resetForm()}}
                            color="#512DA8"
                            title="SUBMIT" 
                            />
                        <Button 
                            onPress = { () =>{this.toggleModal(); this.resetForm()}}
                            color="#808080"
                            title="CANCEL" 
                            />
                    </View>
                </Modal>
            </ScrollView>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);